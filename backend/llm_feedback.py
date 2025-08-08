import openai
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

class LLMFeedbackEngine:
    def __init__(self):
        self.model = "gpt-4"  # or "gpt-3.5-turbo" for faster/cheaper responses
        self.max_tokens = 1500  # Increased for more detailed analysis
        
    async def analyze_interview_response(self, 
                                       question: str, 
                                       answer: str, 
                                       role: str,
                                       context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze a single interview response using LLM with enhanced metrics"""
        try:
            prompt = self._create_enhanced_response_analysis_prompt(question, answer, role, context)
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert interview coach and hiring manager with deep knowledge of technical roles, behavioral psychology, and corporate culture. Provide comprehensive, constructive feedback on interview responses with specific actionable insights."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.7
            )
            
            feedback_text = response.choices[0].message.content
            
            # Parse structured feedback
            structured_feedback = self._parse_enhanced_feedback(feedback_text)
            
            return {
                "score": structured_feedback.get("score", 0),
                "feedback": structured_feedback.get("feedback", ""),
                "strengths": structured_feedback.get("strengths", []),
                "improvements": structured_feedback.get("improvements", []),
                "keywords": structured_feedback.get("keywords", []),
                "confidence": structured_feedback.get("confidence", 0.8),
                "emotional_intelligence": structured_feedback.get("emotional_intelligence", 0),
                "cultural_fit": structured_feedback.get("cultural_fit", 0),
                "communication_clarity": structured_feedback.get("communication_clarity", 0),
                "technical_depth": structured_feedback.get("technical_depth", 0),
                "problem_solving": structured_feedback.get("problem_solving", 0),
                "confidence_level": structured_feedback.get("confidence_level", 0),
                "specificity": structured_feedback.get("specificity", 0),
                "relevance": structured_feedback.get("relevance", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing response: {e}")
            return {
                "score": 0,
                "feedback": "Unable to analyze response at this time.",
                "strengths": [],
                "improvements": ["Technical issue prevented analysis"],
                "keywords": [],
                "confidence": 0.0,
                "emotional_intelligence": 0,
                "cultural_fit": 0,
                "communication_clarity": 0,
                "technical_depth": 0,
                "problem_solving": 0,
                "confidence_level": 0,
                "specificity": 0,
                "relevance": 0,
                "timestamp": datetime.now().isoformat()
            }
    
    async def generate_comprehensive_feedback(self, 
                                            session_data: Dict[str, Any],
                                            role: str) -> Dict[str, Any]:
        """Generate comprehensive feedback for entire interview session with enhanced metrics"""
        try:
            prompt = self._create_enhanced_comprehensive_feedback_prompt(session_data, role)
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert interview coach and career advisor. Provide comprehensive feedback on interview performance including technical skills, communication, emotional intelligence, cultural fit, and career readiness. Focus on actionable insights and specific improvement areas."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            feedback_text = response.choices[0].message.content
            
            # Parse comprehensive feedback
            structured_feedback = self._parse_enhanced_comprehensive_feedback(feedback_text)
            
            return {
                "overall_score": structured_feedback.get("overall_score", 0),
                "communication_score": structured_feedback.get("communication_score", 0),
                "technical_score": structured_feedback.get("technical_score", 0),
                "confidence_score": structured_feedback.get("confidence_score", 0),
                "emotional_intelligence_score": structured_feedback.get("emotional_intelligence_score", 0),
                "cultural_fit_score": structured_feedback.get("cultural_fit_score", 0),
                "problem_solving_score": structured_feedback.get("problem_solving_score", 0),
                "leadership_score": structured_feedback.get("leadership_score", 0),
                "summary": structured_feedback.get("summary", ""),
                "strengths": structured_feedback.get("strengths", []),
                "improvements": structured_feedback.get("improvements", []),
                "recommendations": structured_feedback.get("recommendations", []),
                "next_steps": structured_feedback.get("next_steps", []),
                "career_advice": structured_feedback.get("career_advice", []),
                "skill_gaps": structured_feedback.get("skill_gaps", []),
                "development_plan": structured_feedback.get("development_plan", []),
                "interview_readiness": structured_feedback.get("interview_readiness", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating comprehensive feedback: {e}")
            return {
                "overall_score": 0,
                "communication_score": 0,
                "technical_score": 0,
                "confidence_score": 0,
                "emotional_intelligence_score": 0,
                "cultural_fit_score": 0,
                "problem_solving_score": 0,
                "leadership_score": 0,
                "summary": "Unable to generate comprehensive feedback at this time.",
                "strengths": [],
                "improvements": ["Technical issue prevented analysis"],
                "recommendations": [],
                "next_steps": [],
                "career_advice": [],
                "skill_gaps": [],
                "development_plan": [],
                "interview_readiness": 0,
                "timestamp": datetime.now().isoformat()
            }

    async def analyze_emotional_intelligence(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze emotional intelligence from interview responses"""
        try:
            prompt = self._create_emotional_intelligence_prompt(responses)
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in emotional intelligence and workplace psychology. Analyze interview responses for emotional intelligence indicators including self-awareness, empathy, social skills, and emotional regulation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            ei_text = response.choices[0].message.content
            return self._parse_emotional_intelligence(ei_text)
            
        except Exception as e:
            logger.error(f"Error analyzing emotional intelligence: {e}")
            return {"ei_score": 0, "insights": [], "recommendations": []}

    async def suggest_questions(self, 
                              role: str, 
                              difficulty: str = "medium",
                              question_type: str = "technical") -> List[str]:
        """Generate interview questions based on role and parameters"""
        try:
            prompt = f"""
            Generate 5 {difficulty} {question_type} interview questions for a {role} position.
            Include questions that test:
            - Technical knowledge and problem-solving
            - Behavioral and situational judgment
            - Cultural fit and values alignment
            - Leadership and teamwork capabilities
            - Innovation and creativity
            
            Format as a JSON array of strings.
            """
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert hiring manager and technical recruiter. Generate relevant, challenging interview questions that assess both technical skills and soft skills."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.8
            )
            
            questions_text = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to simple parsing
            try:
                questions = json.loads(questions_text)
                if isinstance(questions, list):
                    return questions
            except:
                # Simple parsing fallback
                questions = [q.strip() for q in questions_text.split('\n') if q.strip() and '?' in q]
                return questions[:5]
                
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return []

    def _create_enhanced_response_analysis_prompt(self, question: str, answer: str, role: str, context: Dict[str, Any] = None) -> str:
        """Create enhanced prompt for analyzing individual responses"""
        context_str = ""
        if context:
            context_str = f"\nContext: {json.dumps(context)}"
        
        return f"""
        Analyze this interview response for a {role} position with comprehensive metrics:
        
        Question: {question}
        Answer: {answer}
        {context_str}
        
        Provide detailed feedback in the following JSON format:
        {{
            "score": <1-10>,
            "feedback": "<detailed, actionable feedback>",
            "strengths": ["<specific strength1>", "<specific strength2>"],
            "improvements": ["<specific improvement1>", "<specific improvement2>"],
            "keywords": ["<relevant keyword1>", "<relevant keyword2>"],
            "confidence": <0.0-1.0>,
            "emotional_intelligence": <1-10>,
            "cultural_fit": <1-10>,
            "communication_clarity": <1-10>,
            "technical_depth": <1-10>,
            "problem_solving": <1-10>,
            "confidence_level": <1-10>,
            "specificity": <1-10>,
            "relevance": <1-10>
        }}
        
        Consider:
        - Technical accuracy and depth
        - Communication effectiveness
        - Emotional intelligence indicators
        - Cultural alignment
        - Problem-solving approach
        - Confidence and poise
        - Specificity of examples
        - Relevance to the question
        """

    def _create_enhanced_comprehensive_feedback_prompt(self, session_data: Dict[str, Any], role: str) -> str:
        """Create enhanced prompt for comprehensive session feedback"""
        return f"""
        Analyze this complete interview session for a {role} position with comprehensive evaluation:
        
        Session Data: {json.dumps(session_data, indent=2)}
        
        Provide comprehensive feedback in the following JSON format:
        {{
            "overall_score": <1-10>,
            "communication_score": <1-10>,
            "technical_score": <1-10>,
            "confidence_score": <1-10>,
            "emotional_intelligence_score": <1-10>,
            "cultural_fit_score": <1-10>,
            "problem_solving_score": <1-10>,
            "leadership_score": <1-10>,
            "summary": "<comprehensive assessment>",
            "strengths": ["<strength1>", "<strength2>"],
            "improvements": ["<improvement1>", "<improvement2>"],
            "recommendations": ["<recommendation1>", "<recommendation2>"],
            "next_steps": ["<next_step1>", "<next_step2>"],
            "career_advice": ["<career advice1>", "<career advice2>"],
            "skill_gaps": ["<skill gap1>", "<skill gap2>"],
            "development_plan": ["<development step1>", "<development step2>"],
            "interview_readiness": <1-10>
        }}
        
        Evaluate:
        - Overall interview performance
        - Technical competency
        - Communication effectiveness
        - Emotional intelligence
        - Cultural fit
        - Problem-solving abilities
        - Leadership potential
        - Career readiness
        """

    def _create_emotional_intelligence_prompt(self, responses: List[Dict[str, Any]]) -> str:
        """Create prompt for emotional intelligence analysis"""
        responses_text = json.dumps(responses, indent=2)
        
        return f"""
        Analyze the emotional intelligence indicators in these interview responses:
        
        Responses: {responses_text}
        
        Provide analysis in the following JSON format:
        {{
            "ei_score": <1-10>,
            "insights": ["<insight1>", "<insight2>"],
            "recommendations": ["<recommendation1>", "<recommendation2>"]
        }}
        
        Consider:
        - Self-awareness and self-reflection
        - Empathy and understanding of others
        - Social skills and relationship building
        - Emotional regulation and stress management
        - Motivation and drive
        """

    def _parse_enhanced_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse enhanced feedback text into structured format"""
        try:
            # Try to extract JSON from the response
            start_idx = feedback_text.find('{')
            end_idx = feedback_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = feedback_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback parsing
                return {
                    "score": 5,
                    "feedback": feedback_text,
                    "strengths": [],
                    "improvements": [],
                    "keywords": [],
                    "confidence": 0.5,
                    "emotional_intelligence": 5,
                    "cultural_fit": 5,
                    "communication_clarity": 5,
                    "technical_depth": 5,
                    "problem_solving": 5,
                    "confidence_level": 5,
                    "specificity": 5,
                    "relevance": 5
                }
        except Exception as e:
            logger.error(f"Error parsing enhanced feedback: {e}")
            return {
                "score": 5,
                "feedback": feedback_text,
                "strengths": [],
                "improvements": [],
                "keywords": [],
                "confidence": 0.5,
                "emotional_intelligence": 5,
                "cultural_fit": 5,
                "communication_clarity": 5,
                "technical_depth": 5,
                "problem_solving": 5,
                "confidence_level": 5,
                "specificity": 5,
                "relevance": 5
            }

    def _parse_enhanced_comprehensive_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Parse enhanced comprehensive feedback text into structured format"""
        try:
            # Try to extract JSON from the response
            start_idx = feedback_text.find('{')
            end_idx = feedback_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = feedback_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback parsing
                return {
                    "overall_score": 5,
                    "communication_score": 5,
                    "technical_score": 5,
                    "confidence_score": 5,
                    "emotional_intelligence_score": 5,
                    "cultural_fit_score": 5,
                    "problem_solving_score": 5,
                    "leadership_score": 5,
                    "summary": feedback_text,
                    "strengths": [],
                    "improvements": [],
                    "recommendations": [],
                    "next_steps": [],
                    "career_advice": [],
                    "skill_gaps": [],
                    "development_plan": [],
                    "interview_readiness": 5
                }
        except Exception as e:
            logger.error(f"Error parsing enhanced comprehensive feedback: {e}")
            return {
                "overall_score": 5,
                "communication_score": 5,
                "technical_score": 5,
                "confidence_score": 5,
                "emotional_intelligence_score": 5,
                "cultural_fit_score": 5,
                "problem_solving_score": 5,
                "leadership_score": 5,
                "summary": feedback_text,
                "strengths": [],
                "improvements": [],
                "recommendations": [],
                "next_steps": [],
                "career_advice": [],
                "skill_gaps": [],
                "development_plan": [],
                "interview_readiness": 5
            }

    def _parse_emotional_intelligence(self, ei_text: str) -> Dict[str, Any]:
        """Parse emotional intelligence analysis"""
        try:
            start_idx = ei_text.find('{')
            end_idx = ei_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = ei_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                return {
                    "ei_score": 5,
                    "insights": [],
                    "recommendations": []
                }
        except Exception as e:
            logger.error(f"Error parsing emotional intelligence: {e}")
            return {
                "ei_score": 5,
                "insights": [],
                "recommendations": []
            }

# Global feedback engine instance
feedback_engine = LLMFeedbackEngine() 