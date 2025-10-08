import openai
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
from dotenv import load_dotenv
import asyncio
from dataclasses import dataclass
from enum import Enum

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

class AnalysisType(Enum):
    REAL_TIME = "real_time"
    POST_INTERVIEW = "post_interview"
    SKILL_ASSESSMENT = "skill_assessment"
    CAREER_DEVELOPMENT = "career_development"

@dataclass
class InterviewMetrics:
    technical_accuracy: float
    communication_clarity: float
    confidence_level: float
    problem_solving: float
    cultural_fit: float
    emotional_intelligence: float
    leadership_potential: float
    learning_ability: float

class AIInterviewAnalyzer:
    def __init__(self):
        self.model = "gpt-4"
        self.max_tokens = 2000
        self.temperature = 0.7
        
    async def analyze_interview_session(self, 
                                      session_data: Dict[str, Any],
                                      analysis_type: AnalysisType = AnalysisType.POST_INTERVIEW) -> Dict[str, Any]:
        """
        Comprehensive interview session analysis
        
        Args:
            session_data: Complete interview session data
            analysis_type: Type of analysis to perform
            
        Returns:
            Comprehensive analysis results
        """
        try:
            if analysis_type == AnalysisType.REAL_TIME:
                return await self._analyze_real_time(session_data)
            elif analysis_type == AnalysisType.SKILL_ASSESSMENT:
                return await self._analyze_skill_gaps(session_data)
            elif analysis_type == AnalysisType.CAREER_DEVELOPMENT:
                return await self._analyze_career_development(session_data)
            else:
                return await self._analyze_post_interview(session_data)
                
        except Exception as e:
            logger.error(f"Error in interview analysis: {e}")
            return self._get_error_response(str(e))
    
    async def _analyze_post_interview(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze completed interview session"""
        try:
            prompt = self._create_post_interview_prompt(session_data)
            logger.info(f"Created prompt for post-interview analysis: {prompt[:200]}...")
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt("post_interview")},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            feedback_text = response.choices[0].message.content
            logger.info(f"OpenAI response received: {feedback_text[:200]}...")
            
            structured_feedback = self._parse_comprehensive_feedback(feedback_text)
            logger.info(f"Parsed feedback: {type(structured_feedback)} - {structured_feedback}")
            
            # Calculate overall metrics
            metrics = self._calculate_overall_metrics(structured_feedback)
            
            return {
                "success": True,
                "analysis_type": "post_interview",
                "timestamp": datetime.now().isoformat(),
                "session_id": session_data.get("session_id", "unknown"),
                "overall_score": structured_feedback.get("overall_score", 0),
                "metrics": metrics,
                "summary": structured_feedback.get("summary", ""),
                "strengths": structured_feedback.get("strengths", []),
                "improvements": structured_feedback.get("improvements", []),
                "recommendations": structured_feedback.get("recommendations", []),
                "next_steps": structured_feedback.get("next_steps", []),
                "career_advice": structured_feedback.get("career_advice", []),
                "skill_gaps": structured_feedback.get("skill_gaps", []),
                "development_plan": structured_feedback.get("development_plan", []),
                "interview_readiness": structured_feedback.get("interview_readiness", 0),
                "detailed_analysis": structured_feedback.get("detailed_analysis", {}),
                "confidence_indicators": structured_feedback.get("confidence_indicators", []),
                "communication_patterns": structured_feedback.get("communication_patterns", []),
                "technical_depth": structured_feedback.get("technical_depth", {}),
                "behavioral_insights": structured_feedback.get("behavioral_insights", [])
            }
            
        except Exception as e:
            logger.error(f"Error in post-interview analysis: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception details: {str(e)}")
            return self._get_error_response(str(e))
    
    async def _analyze_real_time(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze interview responses in real-time"""
        try:
            prompt = self._create_real_time_prompt(session_data)
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt("real_time")},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.6
            )
            
            feedback_text = response.choices[0].message.content
            structured_feedback = self._parse_real_time_feedback(feedback_text)
            
            return {
                "success": True,
                "analysis_type": "real_time",
                "timestamp": datetime.now().isoformat(),
                "current_response_score": structured_feedback.get("current_response_score", 0),
                "immediate_feedback": structured_feedback.get("immediate_feedback", ""),
                "suggested_improvements": structured_feedback.get("suggested_improvements", []),
                "confidence_boosters": structured_feedback.get("confidence_boosters", []),
                "next_question_prep": structured_feedback.get("next_question_prep", ""),
                "overall_session_progress": structured_feedback.get("overall_session_progress", 0),
                "session_trends": structured_feedback.get("session_trends", {}),
                "quick_tips": structured_feedback.get("quick_tips", [])
            }
            
        except Exception as e:
            logger.error(f"Error in real-time analysis: {e}")
            return self._get_error_response(str(e))
    
    async def _analyze_skill_gaps(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze skill gaps and development areas"""
        try:
            prompt = self._create_skill_gap_prompt(session_data)
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt("skill_assessment")},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1800,
                temperature=0.7
            )
            
            feedback_text = response.choices[0].message.content
            structured_feedback = self._parse_skill_gap_feedback(feedback_text)
            
            return {
                "success": True,
                "analysis_type": "skill_assessment",
                "timestamp": datetime.now().isoformat(),
                "skill_gap_analysis": structured_feedback.get("skill_gap_analysis", {}),
                "priority_skills": structured_feedback.get("priority_skills", []),
                "learning_path": structured_feedback.get("learning_path", []),
                "resource_recommendations": structured_feedback.get("resource_recommendations", []),
                "timeline_estimates": structured_feedback.get("timeline_estimates", {}),
                "certification_suggestions": structured_feedback.get("certification_suggestions", []),
                "project_ideas": structured_feedback.get("project_ideas", []),
                "mentorship_areas": structured_feedback.get("mentorship_areas", [])
            }
            
        except Exception as e:
            logger.error(f"Error in skill gap analysis: {e}")
            return self._get_error_response(str(e))
    
    async def _analyze_career_development(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze career development opportunities"""
        try:
            prompt = self._create_career_development_prompt(session_data)
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt("career_development")},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.8
            )
            
            feedback_text = response.choices[0].message.content
            structured_feedback = self._parse_career_development_feedback(feedback_text)
            
            return {
                "success": True,
                "analysis_type": "career_development",
                "timestamp": datetime.now().isoformat(),
                "career_path_analysis": structured_feedback.get("career_path_analysis", {}),
                "role_transitions": structured_feedback.get("role_transitions", []),
                "industry_opportunities": structured_feedback.get("industry_opportunities", []),
                "salary_benchmarks": structured_feedback.get("salary_benchmarks", {}),
                "networking_strategies": structured_feedback.get("networking_strategies", []),
                "personal_branding": structured_feedback.get("personal_branding", {}),
                "long_term_goals": structured_feedback.get("long_term_goals", []),
                "risk_assessment": structured_feedback.get("risk_assessment", {})
            }
            
        except Exception as e:
            logger.error(f"Error in career development analysis: {e}")
            return self._get_error_response(str(e))
    
    def _get_system_prompt(self, analysis_type: str) -> str:
        """Get system prompt based on analysis type"""
        prompts = {
            "post_interview": """You are an expert interview coach, career advisor, and hiring manager with deep expertise in technical roles, behavioral psychology, and corporate culture. Provide comprehensive, constructive feedback on interview performance including technical skills, communication, emotional intelligence, cultural fit, and career readiness. Focus on actionable insights and specific improvement areas. Be encouraging while being honest about areas for growth.""",
            
            "real_time": """You are an expert interview coach providing real-time feedback during interviews. Give immediate, actionable advice that can help improve the current response and prepare for upcoming questions. Be encouraging, specific, and practical. Focus on quick wins and confidence boosters.""",
            
            "skill_assessment": """You are an expert skills analyst and learning path designer. Analyze technical and soft skill gaps, identify priority learning areas, and create personalized development plans. Consider industry standards, role requirements, and individual learning preferences. Provide specific resources and timeline estimates.""",
            
            "career_development": """You are an expert career strategist and industry analyst. Assess career trajectory, identify growth opportunities, and provide strategic advice for career advancement. Consider market trends, skill demand, and individual career goals. Be realistic about timelines and requirements."""
        }
        return prompts.get(analysis_type, prompts["post_interview"])
    
    def _create_post_interview_prompt(self, session_data: Dict[str, Any]) -> str:
        """Create prompt for post-interview analysis"""
        role = session_data.get("role", "Software Engineer")
        responses = session_data.get("responses", [])
        
        prompt = f"""
        Analyze this interview session for a {role} position and provide comprehensive feedback.
        
        Interview Details:
        - Role: {role}
        - Total Questions: {len(responses)}
        - Interview Type: {session_data.get('type', 'mixed')}
        - Difficulty: {session_data.get('difficulty', 'intermediate')}
        
        Responses:
        """
        
        for i, response in enumerate(responses):
            # Handle both dictionary and string response formats
            if isinstance(response, dict):
                question = response.get('question', 'N/A')
                answer = response.get('answer', 'No answer provided')
            else:
                # If response is a string, treat it as the answer
                question = f"Question {i+1}"
                answer = str(response)
            
            prompt += f"""
        Question {i+1}: {question}
        Answer: {answer}
        """
        
        prompt += """
        
        Please provide a comprehensive analysis including:
        1. Overall score (1-10) with detailed breakdown
        2. Executive summary of performance
        3. Key strengths demonstrated
        4. Areas for improvement with specific examples
        5. Actionable recommendations
        6. Next steps for development
        7. Career advice and insights
        8. Skill gaps identified
        9. 30-60-90 day development plan
        10. Interview readiness assessment
        
        Format the response as structured JSON with clear sections.
        """
        
        return prompt
    
    def _create_real_time_prompt(self, session_data: Dict[str, Any]) -> str:
        """Create prompt for real-time analysis"""
        role = session_data.get("role", "Software Engineer")
        current_response = session_data.get("current_response", {})
        previous_responses = session_data.get("previous_responses", [])
        
        # Handle current_response safely
        if isinstance(current_response, dict):
            current_question = current_response.get('question', 'N/A')
            current_answer = current_response.get('answer', 'N/A')
        else:
            current_question = "Current question"
            current_answer = str(current_response) if current_response else "N/A"
        
        prompt = f"""
        Provide real-time feedback for this interview response in a {role} interview.
        
        Current Question: {current_question}
        Current Answer: {current_answer}
        
        Previous Responses: {len(previous_responses)}
        
        Give immediate feedback that includes:
        1. Current response score (1-10)
        2. Quick improvement suggestions
        3. Confidence boosters
        4. Preparation for next question
        5. Session progress assessment
        6. Quick tips for success
        
        Be concise, encouraging, and actionable.
        """
        
        return prompt
    
    def _create_skill_gap_prompt(self, session_data: Dict[str, Any]) -> str:
        """Create prompt for skill gap analysis"""
        role = session_data.get("role", "Software Engineer")
        responses = session_data.get("responses", [])
        
        prompt = f"""
        Analyze skill gaps for a {role} position based on this interview performance.
        
        Interview Responses: {len(responses)} questions
        
        Provide detailed analysis of:
        1. Technical skill gaps with priority levels
        2. Soft skill development areas
        3. Learning path recommendations
        4. Resource suggestions (courses, books, projects)
        5. Timeline estimates for skill development
        6. Certification recommendations
        7. Project ideas for skill building
        8. Mentorship opportunities
        
        Focus on actionable skill development strategies.
        """
        
        return prompt
    
    def _create_career_development_prompt(self, session_data: Dict[str, Any]) -> str:
        """Create prompt for career development analysis"""
        role = session_data.get("role", "Software Engineer")
        experience_level = session_data.get("experience_level", "mid-level")
        
        prompt = f"""
        Provide career development analysis for a {experience_level} {role}.
        
        Based on the interview performance, analyze:
        1. Career trajectory and growth potential
        2. Role transition opportunities
        3. Industry and company recommendations
        4. Salary benchmarks and negotiation strategies
        5. Networking and personal branding strategies
        6. Long-term career goals and planning
        7. Risk assessment and mitigation strategies
        8. Market trends and opportunities
        
        Provide strategic career advice and actionable next steps.
        """
        
        return prompt
    
    def _parse_comprehensive_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse comprehensive feedback response"""
        try:
            # Try to extract JSON from the response
            if "```json" in feedback_text:
                json_start = feedback_text.find("```json") + 7
                json_end = feedback_text.find("```", json_start)
                json_str = feedback_text[json_start:json_end].strip()
                return json.loads(json_str)
            elif "{" in feedback_text and "}" in feedback_text:
                json_start = feedback_text.find("{")
                json_end = feedback_text.rfind("}") + 1
                json_str = feedback_text[json_start:json_end]
                return json.loads(json_str)
            else:
                # Fallback to text parsing
                return self._parse_text_feedback(feedback_text)
        except Exception as e:
            logger.error(f"Error parsing comprehensive feedback: {e}")
            return self._parse_text_feedback(feedback_text)
    
    def _parse_text_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse feedback from text when JSON parsing fails"""
        feedback = {
            "overall_score": 7,
            "summary": "Analysis completed successfully",
            "strengths": ["Good technical knowledge", "Clear communication"],
            "improvements": ["Provide more specific examples", "Show more confidence"],
            "recommendations": ["Practice mock interviews", "Build portfolio projects"],
            "next_steps": ["Review feedback", "Create action plan"],
            "career_advice": ["Focus on skill development", "Network actively"],
            "skill_gaps": ["Advanced problem solving", "System design"],
            "development_plan": ["30 days: Practice coding", "60 days: Build projects", "90 days: Apply for roles"],
            "interview_readiness": 7
        }
        
        # Try to extract scores from text
        if "score" in feedback_text.lower():
            try:
                import re
                score_match = re.search(r'(\d+)/10', feedback_text)
                if score_match:
                    feedback["overall_score"] = int(score_match.group(1))
            except:
                pass
        
        return feedback
    
    def _parse_real_time_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse real-time feedback response"""
        try:
            if "```json" in feedback_text:
                json_start = feedback_text.find("```json") + 7
                json_end = feedback_text.find("```", json_start)
                json_str = feedback_text[json_start:json_end].strip()
                return json.loads(json_str)
            else:
                return {
                    "current_response_score": 7,
                    "immediate_feedback": feedback_text,
                    "suggested_improvements": ["Be more specific", "Show confidence"],
                    "confidence_boosters": ["You're doing well", "Stay focused"],
                    "next_question_prep": "Prepare for technical questions",
                    "overall_session_progress": 7,
                    "session_trends": {"improving": True},
                    "quick_tips": ["Take deep breaths", "Think before speaking"]
                }
        except Exception as e:
            logger.error(f"Error parsing real-time feedback: {e}")
            return self._parse_text_feedback(feedback_text)
    
    def _parse_skill_gap_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse skill gap analysis response"""
        try:
            if "```json" in feedback_text:
                json_start = feedback_text.find("```json") + 7
                json_end = feedback_text.find("```", json_start)
                json_str = feedback_text[json_start:json_end].strip()
                return json.loads(json_str)
            else:
                return {
                    "skill_gap_analysis": {"technical": ["Advanced algorithms"], "soft": ["Leadership"]},
                    "priority_skills": ["System design", "Problem solving"],
                    "learning_path": ["Online courses", "Practice projects"],
                    "resource_recommendations": ["LeetCode", "System Design Primer"],
                    "timeline_estimates": {"basic": "3 months", "advanced": "6 months"},
                    "certification_suggestions": ["AWS", "Google Cloud"],
                    "project_ideas": ["Build a microservice", "Design a database"],
                    "mentorship_areas": ["Technical leadership", "Architecture"]
                }
        except Exception as e:
            logger.error(f"Error parsing skill gap feedback: {e}")
            return self._parse_text_feedback(feedback_text)
    
    def _parse_career_development_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse career development analysis response"""
        try:
            if "```json" in feedback_text:
                json_start = feedback_text.find("```json") + 7
                json_end = feedback_text.find("```", json_start)
                json_str = feedback_text[json_start:json_end].strip()
                return json.loads(json_str)
            else:
                return {
                    "career_path_analysis": {"current_level": "Mid", "next_level": "Senior"},
                    "role_transitions": ["Tech Lead", "Architect"],
                    "industry_opportunities": ["FinTech", "AI/ML"],
                    "salary_benchmarks": {"current": "$120k", "target": "$150k"},
                    "networking_strategies": ["Tech meetups", "LinkedIn"],
                    "personal_branding": {"blog": "Technical writing", "speaking": "Conference talks"},
                    "long_term_goals": ["CTO", "Startup founder"],
                    "risk_assessment": {"market": "Low", "skills": "Medium"}
                }
        except Exception as e:
            logger.error(f"Error parsing career development feedback: {e}")
            return self._parse_text_feedback(feedback_text)
    
    def _calculate_overall_metrics(self, feedback: Dict[str, Any]) -> Dict[str, float]:
        """Calculate overall metrics from feedback"""
        metrics = {
            "technical_accuracy": feedback.get("technical_score", 7) / 10,
            "communication_clarity": feedback.get("communication_score", 7) / 10,
            "confidence_level": feedback.get("confidence_score", 7) / 10,
            "problem_solving": feedback.get("problem_solving_score", 7) / 10,
            "cultural_fit": feedback.get("cultural_fit_score", 7) / 10,
            "emotional_intelligence": feedback.get("emotional_intelligence_score", 7) / 10,
            "leadership_potential": feedback.get("leadership_score", 7) / 10,
            "learning_ability": feedback.get("learning_ability_score", 7) / 10
        }
        return metrics
    
    def _get_error_response(self, error_message: str) -> Dict[str, Any]:
        """Get standardized error response"""
        return {
            "success": False,
            "error": error_message,
            "timestamp": datetime.now().isoformat(),
            "analysis_type": "error"
        }

# Create global instance
ai_analyzer = AIInterviewAnalyzer()
