from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, FileResponse
import json
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
from llm_feedback import feedback_engine
import asyncio
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import io

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

def get_user_email_from_request(request: Request) -> str:
    """Extract user email from request headers or session"""
    # This is a simplified version - you might need to implement proper authentication
    user_email = request.headers.get("X-User-Email")
    if not user_email:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return user_email

@router.get("/session/{session_id}")
async def get_session_feedback(session_id: str, request: Request):
    """Get detailed feedback for a specific session"""
    try:
        user_email = get_user_email_from_request(request)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get session feedback
        cursor.execute("""
            SELECT * FROM feedback 
            WHERE session_id = ? AND user_email = ?
        """, (session_id, user_email))
        
        feedback = cursor.fetchone()
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # Get session details
        cursor.execute("""
            SELECT * FROM interview_sessions 
            WHERE session_id = ? AND user_email = ?
        """, (session_id, user_email))
        
        session = cursor.fetchone()
        
        # Get responses for this session
        cursor.execute("""
            SELECT ur.*, iq.question_text 
            FROM user_responses ur
            JOIN interview_questions iq ON ur.question_id = iq.id
            WHERE ur.session_id = ?
            ORDER BY ur.created_at
        """, (session_id,))
        
        responses = cursor.fetchall()
        
        conn.close()
        
        return {
            "success": True,
            "feedback": {
                "overall_score": feedback["overall_score"],
                "technical_score": feedback["technical_score"],
                "communication_score": feedback["communication_score"],
                "confidence_score": feedback["confidence_score"],
                "strengths": json.loads(feedback["strengths"]) if feedback["strengths"] else [],
                "improvements": json.loads(feedback["areas_for_improvement"]) if feedback["areas_for_improvement"] else [],
                "suggestions": feedback["suggestions"],
                "detailed_feedback": feedback["detailed_feedback"],
                "created_at": feedback["created_at"]
            },
            "session": {
                "session_id": session["session_id"],
                "role": session["role"],
                "interview_mode": session["interview_mode"],
                "start_time": session["start_time"],
                "end_time": session["end_time"],
                "total_questions": session["total_questions"],
                "questions_answered": session["questions_answered"]
            },
            "responses": [
                {
                    "question": response["question_text"],
                    "answer": response["user_answer"],
                    "duration": response["response_duration"],
                    "confidence": response["confidence_score"],
                    "created_at": response["created_at"]
                }
                for response in responses
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving feedback: {str(e)}")

@router.get("/history")
async def get_feedback_history(request: Request, limit: int = 20):
    """Get feedback history for the user"""
    try:
        user_email = get_user_email_from_request(request)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT fe.*, s.role, s.interview_mode, s.start_time, s.end_time
            FROM feedback fe
            JOIN interview_sessions s ON fe.session_id = s.session_id
            WHERE fe.user_email = ?
            ORDER BY fe.created_at DESC
            LIMIT ?
        """, (user_email, limit))
        
        feedback_history = cursor.fetchall()
        conn.close()
        
        return {
            "success": True,
            "feedback_history": [
                {
                    "session_id": feedback["session_id"],
                    "overall_score": feedback["overall_score"],
                    "technical_score": feedback["technical_score"],
                    "communication_score": feedback["communication_score"],
                    "confidence_score": feedback["confidence_score"],
                    "strengths": json.loads(feedback["strengths"]) if feedback["strengths"] else [],
                    "improvements": json.loads(feedback["areas_for_improvement"]) if feedback["areas_for_improvement"] else [],
                    "suggestions": feedback["suggestions"],
                    "role": feedback["role"],
                    "interview_mode": feedback["interview_mode"],
                    "start_time": feedback["start_time"],
                    "end_time": feedback["end_time"],
                    "created_at": feedback["created_at"]
                }
                for feedback in feedback_history
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving feedback history: {str(e)}")

@router.post("/ai-suggestions")
async def generate_ai_suggestions(request: Request):
    """Generate AI-powered suggestions based on user's interview and practice history"""
    try:
        user_email = get_user_email_from_request(request)
        data = await request.json()
        
        # Get user's interview history
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get recent interview sessions with feedback
        cursor.execute("""
            SELECT fe.*, s.role, s.interview_mode, s.start_time
            FROM feedback fe
            JOIN interview_sessions s ON fe.session_id = s.session_id
            WHERE fe.user_email = ?
            ORDER BY fe.created_at DESC
            LIMIT 10
        """, (user_email,))
        
        interview_history_raw = cursor.fetchall()
        interview_columns = [description[0] for description in cursor.description]
        
        # Get practice sessions (if you have a practice table)
        cursor.execute("""
            SELECT * FROM practice_sessions 
            WHERE user_email = ?
            ORDER BY created_at DESC
            LIMIT 10
        """, (user_email,))
        
        practice_history_raw = cursor.fetchall()
        practice_columns = [description[0] for description in cursor.description]
        conn.close()
        
        # Convert raw results to dictionaries
        interview_history = []
        for row in interview_history_raw:
            session_dict = dict(zip(interview_columns, row))
            interview_history.append(session_dict)
        
        practice_history = []
        for row in practice_history_raw:
            session_dict = dict(zip(practice_columns, row))
            practice_history.append(session_dict)
        
        # Prepare data for AI analysis
        analysis_data = {
            "interview_sessions": [
                {
                    "role": session.get("role", ""),
                    "mode": session.get("interview_mode", ""),
                    "overall_score": session.get("overall_score", 0),
                    "technical_score": session.get("technical_score", 0),
                    "communication_score": session.get("communication_score", 0),
                    "confidence_score": session.get("confidence_score", 0),
                    "strengths": json.loads(session.get("strengths", "[]")) if session.get("strengths") else [],
                    "improvements": json.loads(session.get("areas_for_improvement", "[]")) if session.get("areas_for_improvement") else [],
                    "suggestions": session.get("suggestions", ""),
                    "date": session.get("start_time", "")
                }
                for session in interview_history
            ],
            "practice_sessions": [
                {
                    "mode": session.get("mode", ""),
                    "score": session.get("score", 0),
                    "duration": session.get("duration", 0),
                    "date": session.get("created_at", "")
                }
                for session in practice_history
            ],
            "timeframe": data.get("timeframe", "all")
        }
        
        # Generate AI suggestions
        try:
            suggestions = await feedback_engine.generate_comprehensive_feedback(
                analysis_data, 
                "general"  # Default role for general suggestions
            )
        except Exception as ai_error:
            print(f"AI suggestions generation failed: {ai_error}")
            suggestions = None
        
        # Process and structure the suggestions
        processed_suggestions = {
            "focusAreas": [
                "Improve technical depth in system design questions",
                "Enhance communication clarity and structure",
                "Build confidence in behavioral responses",
                "Practice time management during interviews"
            ],
            "recommendedActions": [
                "Complete 2-3 practice sessions per week",
                "Focus on STAR method for behavioral questions",
                "Review system design fundamentals",
                "Record and analyze your responses"
            ],
            "practiceRecommendations": [
                "Start with beginner mode to build confidence",
                "Progress to intermediate for balanced practice",
                "Use advanced mode for challenging scenarios",
                "Focus on behavioral questions for leadership roles"
            ],
            "nextSteps": [
                "Schedule a mock interview this week",
                "Review your weakest areas identified",
                "Practice with a friend or mentor",
                "Set specific improvement goals"
            ]
        }
        
        # If AI suggestions are available, use them
        if suggestions and suggestions.get("recommendations"):
            processed_suggestions["recommendedActions"] = suggestions["recommendations"]
        
        if suggestions and suggestions.get("next_steps"):
            processed_suggestions["nextSteps"] = suggestions["next_steps"]
        
        return {
            "success": True,
            "suggestions": processed_suggestions,
            "analysis_summary": {
                "total_interviews": len(interview_history),
                "total_practice_sessions": len(practice_history),
                "average_score": sum(session.get("overall_score", 0) for session in interview_history) / len(interview_history) if interview_history else 0,
                "performance_trend": "improving" if len(interview_history) >= 2 and interview_history[0].get("overall_score", 0) > interview_history[-1].get("overall_score", 0) else "stable"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating AI suggestions: {str(e)}")

@router.post("/export")
async def export_feedback_report(request: Request):
    """Export feedback report as PDF"""
    try:
        user_email = get_user_email_from_request(request)
        data = await request.json()
        
        # Create PDF report
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph("Interview Performance Feedback Report", title_style))
        story.append(Spacer(1, 20))
        
        # User info
        story.append(Paragraph(f"Generated for: {user_email}", styles['Normal']))
        story.append(Paragraph(f"Report Date: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Overview section
        story.append(Paragraph("Performance Overview", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        # Stats table
        stats_data = [
            ['Metric', 'Value'],
            ['Total Interviews', str(data.get('interviewHistory', []).__len__())],
            ['Total Practice Sessions', str(data.get('practiceHistory', []).__len__())],
            ['Average Score', f"{sum(session.get('overall_score', 0) for session in data.get('interviewHistory', [])) / max(len(data.get('interviewHistory', [])), 1):.1f}/10"],
            ['Performance Trend', data.get('aiSuggestions', {}).get('analysis_summary', {}).get('performance_trend', 'N/A')]
        ]
        
        stats_table = Table(stats_data, colWidths=[2*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 30))
        
        # AI Suggestions section
        if data.get('aiSuggestions'):
            story.append(Paragraph("AI-Powered Recommendations", styles['Heading2']))
            story.append(Spacer(1, 12))
            
            suggestions = data['aiSuggestions'].get('suggestions', {})
            
            # Focus Areas
            if suggestions.get('focusAreas'):
                story.append(Paragraph("Focus Areas:", styles['Heading3']))
                for area in suggestions['focusAreas']:
                    story.append(Paragraph(f"• {area}", styles['Normal']))
                story.append(Spacer(1, 12))
            
            # Recommended Actions
            if suggestions.get('recommendedActions'):
                story.append(Paragraph("Recommended Actions:", styles['Heading3']))
                for action in suggestions['recommendedActions']:
                    story.append(Paragraph(f"• {action}", styles['Normal']))
                story.append(Spacer(1, 12))
            
            # Practice Recommendations
            if suggestions.get('practiceRecommendations'):
                story.append(Paragraph("Practice Recommendations:", styles['Heading3']))
                for rec in suggestions['practiceRecommendations']:
                    story.append(Paragraph(f"• {rec}", styles['Normal']))
                story.append(Spacer(1, 12))
            
            # Next Steps
            if suggestions.get('nextSteps'):
                story.append(Paragraph("Next Steps:", styles['Heading3']))
                for step in suggestions['nextSteps']:
                    story.append(Paragraph(f"• {step}", styles['Normal']))
                story.append(Spacer(1, 20))
        
        # Recent Sessions section
        story.append(Paragraph("Recent Sessions", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        # Combine and sort sessions
        all_sessions = []
        for session in data.get('interviewHistory', []):
            session['type'] = 'interview'
            all_sessions.append(session)
        
        for session in data.get('practiceHistory', []):
            session['type'] = 'practice'
            all_sessions.append(session)
        
        all_sessions.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        if all_sessions:
            sessions_data = [['Type', 'Date', 'Score', 'Duration']]
            for session in all_sessions[:10]:  # Show last 10 sessions
                sessions_data.append([
                    session.get('type', 'N/A').title(),
                    session.get('created_at', 'N/A')[:10] if session.get('created_at') else 'N/A',
                    f"{session.get('overall_score', session.get('score', 'N/A'))}/10",
                    f"{session.get('duration', 0) // 60}m" if session.get('duration') else 'N/A'
                ])
            
            sessions_table = Table(sessions_data, colWidths=[1*inch, 1.5*inch, 1*inch, 1*inch])
            sessions_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(sessions_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Return PDF file
        return FileResponse(
            buffer,
            media_type='application/pdf',
            filename=f'feedback-report-{datetime.now().strftime("%Y-%m-%d")}.pdf'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF report: {str(e)}")

@router.get("/analytics")
async def get_feedback_analytics(request: Request):
    """Get analytics and insights from feedback data"""
    try:
        user_email = get_user_email_from_request(request)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all feedback data
        cursor.execute("""
            SELECT fe.*, s.role, s.interview_mode
            FROM feedback fe
            JOIN interview_sessions s ON fe.session_id = s.session_id
            WHERE fe.user_email = ?
            ORDER BY fe.created_at DESC
        """, (user_email,))
        
        all_feedback = cursor.fetchall()
        conn.close()
        
        if not all_feedback:
            return {
                "success": True,
                "analytics": {
                    "message": "No feedback data available yet. Complete some interviews to see analytics."
                }
            }
        
        # Calculate analytics
        total_sessions = len(all_feedback)
        avg_overall_score = sum(f["overall_score"] for f in all_feedback) / total_sessions
        avg_technical_score = sum(f["technical_score"] for f in all_feedback if f["technical_score"]) / total_sessions
        avg_communication_score = sum(f["communication_score"] for f in all_feedback if f["communication_score"]) / total_sessions
        avg_confidence_score = sum(f["confidence_score"] for f in all_feedback if f["confidence_score"]) / total_sessions
        
        # Performance trends
        recent_sessions = all_feedback[:5]
        older_sessions = all_feedback[-5:] if len(all_feedback) >= 5 else all_feedback
        
        recent_avg = sum(s["overall_score"] for s in recent_sessions) / len(recent_sessions)
        older_avg = sum(s["overall_score"] for s in older_sessions) / len(older_sessions)
        
        if recent_avg > older_avg + 1:
            trend = "improving"
        elif recent_avg < older_avg - 1:
            trend = "declining"
        else:
            trend = "stable"
        
        # Role performance
        role_performance = {}
        for feedback in all_feedback:
            role = feedback["role"]
            if role not in role_performance:
                role_performance[role] = []
            role_performance[role].append(feedback["overall_score"])
        
        role_analytics = {
            role: {
                "count": len(scores),
                "average_score": sum(scores) / len(scores),
                "best_score": max(scores),
                "worst_score": min(scores)
            }
            for role, scores in role_performance.items()
        }
        
        # Common strengths and weaknesses
        all_strengths = []
        all_weaknesses = []
        
        for feedback in all_feedback:
            if feedback["strengths"]:
                all_strengths.extend(json.loads(feedback["strengths"]))
            if feedback["areas_for_improvement"]:
                all_weaknesses.extend(json.loads(feedback["areas_for_improvement"]))
        
        # Count occurrences
        strength_counts = {}
        weakness_counts = {}
        
        for strength in all_strengths:
            strength_counts[strength] = strength_counts.get(strength, 0) + 1
        
        for weakness in all_weaknesses:
            weakness_counts[weakness] = weakness_counts.get(weakness, 0) + 1
        
        top_strengths = sorted(strength_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_weaknesses = sorted(weakness_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "success": True,
            "analytics": {
                "overview": {
                    "total_sessions": total_sessions,
                    "average_overall_score": round(avg_overall_score, 1),
                    "average_technical_score": round(avg_technical_score, 1),
                    "average_communication_score": round(avg_communication_score, 1),
                    "average_confidence_score": round(avg_confidence_score, 1),
                    "performance_trend": trend
                },
                "role_performance": role_analytics,
                "top_strengths": [{"strength": s[0], "count": s[1]} for s in top_strengths],
                "top_weaknesses": [{"weakness": w[0], "count": w[1]} for w in top_weaknesses],
                "improvement_areas": [
                    "Focus on technical depth",
                    "Improve communication clarity",
                    "Build confidence in responses",
                    "Practice time management",
                    "Enhance problem-solving approach"
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}") 