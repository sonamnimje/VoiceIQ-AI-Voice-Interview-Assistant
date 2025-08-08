import json
import random
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InterviewMode(Enum):
    HR = "hr"
    TECH = "tech"
    PUZZLE = "puzzle"
    CASE_STUDY = "case_study"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"

class InterviewModeManager:
    def __init__(self):
        self.question_banks = self._initialize_question_banks()
        self.mode_configs = self._initialize_mode_configs()
    
    def _initialize_question_banks(self) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
        """Initialize question banks for different interview modes"""
        return {
            "hr": {
                "Software Engineer": [
                    {
                        "question": "Tell me about yourself and your background in software development.",
                        "type": "opening",
                        "expected_keywords": ["experience", "projects", "technologies"],
                        "time_limit": 120
                    },
                    {
                        "question": "Why are you interested in this position and our company?",
                        "type": "motivation",
                        "expected_keywords": ["company", "culture", "growth", "challenges"],
                        "time_limit": 90
                    },
                    {
                        "question": "Describe a challenging project you worked on and how you overcame obstacles.",
                        "type": "experience",
                        "expected_keywords": ["problem-solving", "teamwork", "learning"],
                        "time_limit": 150
                    },
                    {
                        "question": "Where do you see yourself in 5 years?",
                        "type": "career_goals",
                        "expected_keywords": ["growth", "leadership", "skills"],
                        "time_limit": 90
                    },
                    {
                        "question": "How do you handle working under pressure and tight deadlines?",
                        "type": "work_style",
                        "expected_keywords": ["prioritization", "communication", "stress"],
                        "time_limit": 120
                    }
                ],
                "Data Scientist": [
                    {
                        "question": "What sparked your interest in data science and machine learning?",
                        "type": "motivation",
                        "expected_keywords": ["data", "analytics", "insights", "impact"],
                        "time_limit": 120
                    },
                    {
                        "question": "Describe a data project where you had to work with messy or incomplete data.",
                        "type": "experience",
                        "expected_keywords": ["data_cleaning", "preprocessing", "validation"],
                        "time_limit": 150
                    },
                    {
                        "question": "How do you stay updated with the latest developments in AI and ML?",
                        "type": "learning",
                        "expected_keywords": ["research", "courses", "conferences", "papers"],
                        "time_limit": 90
                    }
                ]
            },
            "tech": {
                "Software Engineer": [
                    {
                        "question": "Explain the difference between REST and GraphQL APIs. When would you use each?",
                        "type": "technical",
                        "difficulty": "medium",
                        "expected_keywords": ["rest", "graphql", "api", "performance", "flexibility"],
                        "time_limit": 120
                    },
                    {
                        "question": "How would you design a URL shortening service like bit.ly?",
                        "type": "system_design",
                        "difficulty": "medium",
                        "expected_keywords": ["database", "scaling", "caching", "load_balancing"],
                        "time_limit": 180
                    },
                    {
                        "question": "Explain the concept of dependency injection and its benefits.",
                        "type": "technical",
                        "difficulty": "medium",
                        "expected_keywords": ["di", "loose_coupling", "testability", "maintainability"],
                        "time_limit": 90
                    },
                    {
                        "question": "How do you handle database migrations in a production environment?",
                        "type": "operational",
                        "difficulty": "medium",
                        "expected_keywords": ["backup", "rollback", "zero_downtime", "testing"],
                        "time_limit": 120
                    }
                ],
                "Data Scientist": [
                    {
                        "question": "Explain the bias-variance tradeoff in machine learning.",
                        "type": "ml_concept",
                        "difficulty": "medium",
                        "expected_keywords": ["bias", "variance", "overfitting", "underfitting"],
                        "time_limit": 120
                    },
                    {
                        "question": "How would you approach a classification problem with imbalanced classes?",
                        "type": "ml_practical",
                        "difficulty": "medium",
                        "expected_keywords": ["resampling", "metrics", "cost_sensitive", "ensemble"],
                        "time_limit": 150
                    },
                    {
                        "question": "Explain the difference between supervised and unsupervised learning with examples.",
                        "type": "ml_concept",
                        "difficulty": "easy",
                        "expected_keywords": ["labeled", "unlabeled", "clustering", "classification"],
                        "time_limit": 120
                    }
                ]
            },
            "puzzle": {
                "Software Engineer": [
                    {
                        "question": "You have 8 balls, 7 weigh the same, 1 is heavier. Using a balance scale, find the heavy ball in minimum weighings.",
                        "type": "logic",
                        "difficulty": "medium",
                        "solution": "3 weighings",
                        "hints": ["Divide and conquer", "Eliminate half each time"],
                        "time_limit": 300
                    },
                    {
                        "question": "Design an algorithm to find the longest palindromic substring in a string.",
                        "type": "algorithm",
                        "difficulty": "hard",
                        "solution": "Dynamic programming or Manacher's algorithm",
                        "hints": ["Consider all possible centers", "Use dynamic programming"],
                        "time_limit": 240
                    },
                    {
                        "question": "You have 100 doors in a row, all initially closed. You make 100 passes. On the first pass, you toggle every door. On the second pass, you toggle every second door. Continue until the 100th pass. Which doors are open?",
                        "type": "logic",
                        "difficulty": "medium",
                        "solution": "Perfect squares (1, 4, 9, 16, 25, 36, 49, 64, 81, 100)",
                        "hints": ["Think about factors", "Perfect squares have odd number of factors"],
                        "time_limit": 300
                    }
                ],
                "Data Scientist": [
                    {
                        "question": "You have a dataset with 1000 features but only 100 samples. How would you handle this high-dimensional problem?",
                        "type": "ml_puzzle",
                        "difficulty": "medium",
                        "solution": "Feature selection, dimensionality reduction, regularization",
                        "hints": ["Consider curse of dimensionality", "Use regularization techniques"],
                        "time_limit": 240
                    },
                    {
                        "question": "Design an experiment to determine if a new drug is effective. How would you control for confounding variables?",
                        "type": "statistics",
                        "difficulty": "medium",
                        "solution": "Randomized controlled trial with placebo group",
                        "hints": ["Randomization", "Control group", "Blinding"],
                        "time_limit": 300
                    }
                ]
            },
            "case_study": {
                "Software Engineer": [
                    {
                        "question": "A social media platform is experiencing slow response times during peak hours. As a backend engineer, how would you diagnose and solve this issue?",
                        "type": "performance",
                        "scenario": "High traffic causing slow response times",
                        "expected_analysis": ["monitoring", "bottlenecks", "scaling", "caching"],
                        "time_limit": 300
                    },
                    {
                        "question": "Your team needs to migrate a monolithic application to microservices. Outline your approach and potential challenges.",
                        "type": "architecture",
                        "scenario": "Monolith to microservices migration",
                        "expected_analysis": ["strangler_pattern", "data_consistency", "deployment", "monitoring"],
                        "time_limit": 360
                    }
                ],
                "Data Scientist": [
                    {
                        "question": "An e-commerce company wants to reduce customer churn. Design a data science approach to predict and prevent customer churn.",
                        "type": "business_impact",
                        "scenario": "Customer churn prediction and prevention",
                        "expected_analysis": ["feature_engineering", "model_selection", "interpretability", "actionable_insights"],
                        "time_limit": 360
                    },
                    {
                        "question": "A healthcare company wants to use AI to detect early signs of disease from medical images. What are the key considerations and challenges?",
                        "type": "ethical_ai",
                        "scenario": "Medical image analysis for disease detection",
                        "expected_analysis": ["data_quality", "bias", "interpretability", "regulatory", "safety"],
                        "time_limit": 300
                    }
                ]
            },
            "behavioral": {
                "Software Engineer": [
                    {
                        "question": "Tell me about a time when you had to learn a new technology quickly to complete a project. What was the situation, and how did you approach it?",
                        "type": "learning_adaptability",
                        "difficulty": "medium",
                        "expected_keywords": ["situation", "task", "action", "result", "learning"],
                        "time_limit": 180
                    },
                    {
                        "question": "Describe a situation where you had to work with a difficult team member. How did you handle the conflict and what was the outcome?",
                        "type": "conflict_resolution",
                        "difficulty": "medium",
                        "expected_keywords": ["conflict", "communication", "resolution", "teamwork", "outcome"],
                        "time_limit": 150
                    },
                    {
                        "question": "Give me an example of a time when you had to make a difficult technical decision. What was your thought process and what was the result?",
                        "type": "decision_making",
                        "difficulty": "medium",
                        "expected_keywords": ["decision", "analysis", "tradeoffs", "outcome", "learning"],
                        "time_limit": 180
                    },
                    {
                        "question": "Tell me about a project where you had to work under pressure with tight deadlines. How did you manage your time and what was the result?",
                        "type": "pressure_handling",
                        "difficulty": "medium",
                        "expected_keywords": ["pressure", "prioritization", "time_management", "delivery", "quality"],
                        "time_limit": 150
                    }
                ],
                "Data Scientist": [
                    {
                        "question": "Describe a time when you had to explain complex technical concepts to non-technical stakeholders. How did you approach this challenge?",
                        "type": "communication",
                        "difficulty": "medium",
                        "expected_keywords": ["simplification", "visualization", "stakeholder", "impact", "understanding"],
                        "time_limit": 150
                    },
                    {
                        "question": "Tell me about a data science project that didn't go as planned. What went wrong and what did you learn from it?",
                        "type": "failure_learning",
                        "difficulty": "medium",
                        "expected_keywords": ["failure", "analysis", "learning", "improvement", "resilience"],
                        "time_limit": 180
                    },
                    {
                        "question": "Give me an example of when you had to make a recommendation based on incomplete or messy data. How did you handle the uncertainty?",
                        "type": "uncertainty_handling",
                        "difficulty": "medium",
                        "expected_keywords": ["uncertainty", "assumptions", "validation", "risk", "recommendation"],
                        "time_limit": 150
                    }
                ]
            },
            "system_design": {
                "Software Engineer": [
                    {
                        "question": "Design a URL shortening service like bit.ly. Consider scalability, performance, and reliability requirements.",
                        "type": "web_service",
                        "difficulty": "medium",
                        "expected_keywords": ["database", "caching", "load_balancing", "scalability", "consistency"],
                        "time_limit": 360
                    },
                    {
                        "question": "Design a real-time chat application that can handle millions of concurrent users. Consider message delivery, presence, and scalability.",
                        "type": "real_time",
                        "difficulty": "hard",
                        "expected_keywords": ["websockets", "message_queue", "distributed", "latency", "reliability"],
                        "time_limit": 420
                    },
                    {
                        "question": "Design a recommendation system for an e-commerce platform. Consider personalization, scalability, and real-time updates.",
                        "type": "recommendation",
                        "difficulty": "medium",
                        "expected_keywords": ["collaborative_filtering", "content_based", "machine_learning", "scalability", "personalization"],
                        "time_limit": 360
                    }
                ],
                "Data Scientist": [
                    {
                        "question": "Design a data pipeline for processing and analyzing real-time streaming data from IoT devices. Consider data quality, scalability, and analytics.",
                        "type": "data_pipeline",
                        "difficulty": "medium",
                        "expected_keywords": ["streaming", "data_quality", "scalability", "analytics", "monitoring"],
                        "time_limit": 360
                    },
                    {
                        "question": "Design a machine learning system for fraud detection in financial transactions. Consider real-time processing, accuracy, and explainability.",
                        "type": "ml_system",
                        "difficulty": "hard",
                        "expected_keywords": ["real_time", "accuracy", "explainability", "latency", "monitoring"],
                        "time_limit": 420
                    }
                ]
            }
        }
    
    def _initialize_mode_configs(self) -> Dict[str, Dict[str, Any]]:
        """Initialize configuration for different interview modes"""
        return {
            "hr": {
                "name": "HR Interview",
                "description": "Behavioral and cultural fit assessment with focus on soft skills and company alignment",
                "duration": 30,
                "question_count": 5,
                "focus_areas": ["communication", "culture_fit", "motivation", "experience", "teamwork"],
                "scoring_criteria": ["clarity", "relevance", "examples", "enthusiasm", "authenticity"]
            },
            "tech": {
                "name": "Technical Interview",
                "description": "Comprehensive technical skills and problem-solving assessment",
                "duration": 45,
                "question_count": 4,
                "focus_areas": ["technical_knowledge", "problem_solving", "system_design", "coding", "algorithms"],
                "scoring_criteria": ["accuracy", "depth", "approach", "communication", "optimization"]
            },
            "puzzle": {
                "name": "Puzzle Interview",
                "description": "Logic and analytical thinking assessment with creative problem-solving",
                "duration": 60,
                "question_count": 3,
                "focus_areas": ["logical_thinking", "analytical_skills", "creativity", "persistence", "pattern_recognition"],
                "scoring_criteria": ["approach", "logic", "creativity", "persistence", "efficiency"]
            },
            "case_study": {
                "name": "Case Study Interview",
                "description": "Real-world problem-solving and business impact assessment",
                "duration": 45,
                "question_count": 2,
                "focus_areas": ["business_acumen", "problem_solving", "communication", "impact", "strategy"],
                "scoring_criteria": ["analysis", "structure", "insights", "recommendations", "feasibility"]
            },
            "behavioral": {
                "name": "Behavioral Interview",
                "description": "STAR method focused questions to assess past behavior and performance",
                "duration": 40,
                "question_count": 4,
                "focus_areas": ["situation_handling", "teamwork", "leadership", "conflict_resolution", "achievements"],
                "scoring_criteria": ["star_method", "specificity", "outcomes", "learning", "growth"]
            },
            "system_design": {
                "name": "System Design Interview",
                "description": "Architecture and scalable system design assessment",
                "duration": 60,
                "question_count": 2,
                "focus_areas": ["architecture", "scalability", "performance", "reliability", "tradeoffs"],
                "scoring_criteria": ["design_approach", "scalability", "tradeoffs", "communication", "depth"]
            }
        }
    
    def get_interview_questions(self, mode: str, role: str, difficulty: str = "medium", count: int = None) -> List[Dict[str, Any]]:
        """Get questions for a specific interview mode and role"""
        if mode not in self.question_banks:
            raise ValueError(f"Interview mode '{mode}' not supported")
        
        if role not in self.question_banks[mode]:
            # Fallback to Software Engineer questions
            role = "Software Engineer"
        
        questions = self.question_banks[mode][role]
        
        # Filter by difficulty if specified
        if difficulty != "all":
            questions = [q for q in questions if q.get("difficulty", "medium") == difficulty]
        
        # Randomize order
        random.shuffle(questions)
        
        # Limit to specified count or configured question count
        if count is not None:
            max_questions = min(count, len(questions))
        else:
            config = self.mode_configs.get(mode, {})
            max_questions = config.get("question_count", len(questions))
        
        return questions[:max_questions]
    
    def get_mode_config(self, mode: str) -> Dict[str, Any]:
        """Get configuration for a specific interview mode"""
        return self.mode_configs.get(mode, {})
    
    def evaluate_response(self, question: Dict[str, Any], response: str, mode: str) -> Dict[str, Any]:
        """Evaluate a response based on interview mode and question type with enhanced metrics"""
        evaluation = {
            "score": 0,
            "feedback": "",
            "strengths": [],
            "improvements": [],
            "keywords_found": [],
            "time_used": 0,
            "emotional_intelligence": 0,
            "cultural_fit": 0,
            "communication_clarity": 0,
            "technical_depth": 0,
            "problem_solving": 0,
            "confidence_level": 0,
            "specificity": 0,
            "relevance": 0,
            "leadership_potential": 0,
            "innovation_creativity": 0,
            "stress_management": 0,
            "adaptability": 0
        }
        
        # Extract keywords from response
        response_lower = response.lower()
        expected_keywords = question.get("expected_keywords", [])
        found_keywords = [kw for kw in expected_keywords if kw in response_lower]
        evaluation["keywords_found"] = found_keywords
        
        # Calculate keyword score
        keyword_score = len(found_keywords) / len(expected_keywords) if expected_keywords else 0
        
        # Mode-specific evaluation
        if mode == "hr":
            evaluation.update(self._evaluate_hr_response(question, response, keyword_score))
        elif mode == "tech":
            evaluation.update(self._evaluate_tech_response(question, response, keyword_score))
        elif mode == "puzzle":
            evaluation.update(self._evaluate_puzzle_response(question, response, keyword_score))
        elif mode == "case_study":
            evaluation.update(self._evaluate_case_study_response(question, response, keyword_score))
        elif mode == "behavioral":
            evaluation.update(self._evaluate_behavioral_response(question, response, keyword_score))
        elif mode == "system_design":
            evaluation.update(self._evaluate_system_design_response(question, response, keyword_score))
        
        # Add universal evaluation metrics
        evaluation.update(self._evaluate_universal_metrics(response, question))
        
        return evaluation

    def _evaluate_universal_metrics(self, response: str, question: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate universal metrics that apply to all interview types"""
        metrics = {}
        
        # Emotional Intelligence
        ei_indicators = {
            "self_awareness": ["i learned", "i realized", "i understand", "i recognize"],
            "empathy": ["team", "colleague", "user", "customer", "stakeholder"],
            "social_skills": ["collaboration", "communication", "relationship", "partnership"],
            "emotional_regulation": ["challenge", "pressure", "stress", "difficult", "handled"]
        }
        
        ei_score = 0
        for category, indicators in ei_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                ei_score += 2.5
        metrics["emotional_intelligence"] = min(ei_score, 10)
        
        # Cultural Fit
        cultural_indicators = {
            "values": ["integrity", "honesty", "transparency", "ethics"],
            "growth": ["learning", "improvement", "development", "growth"],
            "innovation": ["creative", "innovative", "new approach", "different"],
            "teamwork": ["team", "collaboration", "support", "help"]
        }
        
        cultural_score = 0
        for category, indicators in cultural_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                cultural_score += 2.5
        metrics["cultural_fit"] = min(cultural_score, 10)
        
        # Communication Clarity
        clarity_score = 5  # Base score
        
        # Structure indicators
        if any(word in response.lower() for word in ["first", "second", "then", "finally", "next"]):
            clarity_score += 2
        
        # Specificity indicators
        if any(word in response.lower() for word in ["specifically", "for example", "instance", "case"]):
            clarity_score += 2
        
        # Conciseness (not too long, not too short)
        word_count = len(response.split())
        if 20 <= word_count <= 100:
            clarity_score += 1
        elif word_count > 100:
            clarity_score -= 1
        
        metrics["communication_clarity"] = min(clarity_score, 10)
        
        # Confidence Level
        confidence_indicators = {
            "positive": ["confident", "sure", "certain", "definitely", "absolutely"],
            "decisive": ["decided", "chose", "selected", "determined"],
            "assertive": ["believe", "think", "feel", "know"]
        }
        
        confidence_score = 5  # Base score
        for category, indicators in confidence_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                confidence_score += 1.5
        
        # Hesitation indicators (negative)
        hesitation_words = ["um", "uh", "like", "you know", "sort of", "kind of"]
        hesitation_count = sum(1 for word in hesitation_words if word in response.lower())
        confidence_score -= hesitation_count * 0.5
        
        metrics["confidence_level"] = max(min(confidence_score, 10), 0)
        
        # Specificity
        specificity_score = 5  # Base score
        
        # Numbers and metrics
        if any(char.isdigit() for char in response):
            specificity_score += 2
        
        # Named entities (people, companies, technologies)
        if any(word in response.lower() for word in ["google", "amazon", "microsoft", "react", "python", "java"]):
            specificity_score += 1
        
        # Time references
        if any(word in response.lower() for word in ["week", "month", "year", "quarter"]):
            specificity_score += 1
        
        metrics["specificity"] = min(specificity_score, 10)
        
        # Relevance
        relevance_score = 7  # Base score for answering the question
        
        # Question keywords in response
        question_words = set(question.get("question", "").lower().split())
        response_words = set(response.lower().split())
        common_words = question_words.intersection(response_words)
        
        if len(common_words) > 0:
            relevance_score += 2
        
        # Topic alignment
        if question.get("type") in response.lower():
            relevance_score += 1
        
        metrics["relevance"] = min(relevance_score, 10)
        
        # Leadership Potential
        leadership_indicators = {
            "initiative": ["led", "initiated", "started", "created", "founded"],
            "mentorship": ["mentored", "taught", "guided", "helped", "supported"],
            "decision_making": ["decided", "chose", "determined", "selected"],
            "responsibility": ["responsible", "accountable", "oversaw", "managed"]
        }
        
        leadership_score = 0
        for category, indicators in leadership_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                leadership_score += 2.5
        metrics["leadership_potential"] = min(leadership_score, 10)
        
        # Innovation & Creativity
        innovation_indicators = {
            "creative_solutions": ["creative", "innovative", "unique", "different", "novel"],
            "problem_solving": ["solved", "resolved", "fixed", "improved", "optimized"],
            "thinking_outside_box": ["alternative", "approach", "method", "strategy"],
            "adaptation": ["adapted", "modified", "changed", "evolved"]
        }
        
        innovation_score = 0
        for category, indicators in innovation_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                innovation_score += 2.5
        metrics["innovation_creativity"] = min(innovation_score, 10)
        
        # Stress Management
        stress_indicators = {
            "calm_under_pressure": ["calm", "focused", "composed", "steady"],
            "problem_framing": ["analyzed", "assessed", "evaluated", "considered"],
            "systematic_approach": ["step by step", "systematically", "methodically"],
            "positive_outlook": ["opportunity", "challenge", "learning", "growth"]
        }
        
        stress_score = 5  # Base score
        for category, indicators in stress_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                stress_score += 1.25
        metrics["stress_management"] = min(stress_score, 10)
        
        # Adaptability
        adaptability_indicators = {
            "flexibility": ["adapted", "adjusted", "modified", "changed"],
            "learning": ["learned", "studied", "researched", "explored"],
            "openness": ["open", "willing", "ready", "excited"],
            "resilience": ["overcame", "persisted", "continued", "pushed through"]
        }
        
        adaptability_score = 0
        for category, indicators in adaptability_indicators.items():
            if any(indicator in response.lower() for indicator in indicators):
                adaptability_score += 2.5
        metrics["adaptability"] = min(adaptability_score, 10)
        
        return metrics
    
    def _evaluate_hr_response(self, question: Dict[str, Any], response: str, keyword_score: float) -> Dict[str, Any]:
        """Evaluate HR interview response with enhanced metrics"""
        score = keyword_score * 30  # 30% for keywords
        strengths = []
        improvements = []
        
        # Length and structure analysis
        word_count = len(response.split())
        if word_count > 80:
            score += 15
            strengths.append("Comprehensive and detailed response")
        elif word_count > 50:
            score += 12
            strengths.append("Good level of detail and elaboration")
        elif word_count > 25:
            score += 8
            strengths.append("Appropriate level of detail")
        else:
            score += 3
            improvements.append("Consider providing more specific examples and details")
        
        # Personal examples and authenticity
        personal_indicators = ["i", "me", "my", "we", "our", "myself"]
        personal_count = sum(1 for word in personal_indicators if word in response.lower())
        if personal_count >= 3:
            score += 15
            strengths.append("Strong use of personal experiences and examples")
        elif personal_count >= 1:
            score += 10
            strengths.append("Good use of personal examples")
        else:
            score += 2
            improvements.append("Include more personal experiences and specific examples")
        
        # Enthusiasm and positive attitude
        positive_words = ["excited", "passionate", "love", "enjoy", "great", "amazing", "thrilled", "motivated"]
        positive_count = sum(1 for word in positive_words if word in response.lower())
        if positive_count >= 2:
            score += 12
            strengths.append("Shows genuine enthusiasm and positive attitude")
        elif positive_count >= 1:
            score += 8
            strengths.append("Demonstrates positive outlook")
        else:
            score += 3
            improvements.append("Show more enthusiasm and passion for the role")
        
        # Professional language and tone
        professional_indicators = ["experience", "skills", "expertise", "knowledge", "professional"]
        professional_count = sum(1 for word in professional_indicators if word in response.lower())
        if professional_count >= 2:
            score += 10
            strengths.append("Uses professional language and terminology")
        else:
            score += 5
            improvements.append("Incorporate more professional terminology")
        
        # Goal alignment and motivation
        goal_indicators = ["goal", "objective", "aim", "aspire", "want", "hope", "plan"]
        if any(word in response.lower() for word in goal_indicators):
            score += 8
            strengths.append("Shows clear goals and motivation")
        else:
            score += 3
            improvements.append("Express your career goals and motivation")
        
        # Company knowledge and research
        company_indicators = ["company", "organization", "culture", "values", "mission", "vision"]
        if any(word in response.lower() for word in company_indicators):
            score += 8
            strengths.append("Demonstrates knowledge about the company")
        else:
            score += 2
            improvements.append("Show knowledge about the company and its culture")
        
        # Problem-solving approach
        problem_solving_indicators = ["challenge", "problem", "solution", "approach", "strategy", "method"]
        if any(word in response.lower() for word in problem_solving_indicators):
            score += 7
            strengths.append("Shows problem-solving mindset")
        else:
            score += 3
            improvements.append("Demonstrate your problem-solving approach")
        
        # Teamwork and collaboration
        teamwork_indicators = ["team", "collaboration", "cooperation", "partnership", "together"]
        if any(word in response.lower() for word in teamwork_indicators):
            score += 7
            strengths.append("Emphasizes teamwork and collaboration")
        else:
            score += 3
            improvements.append("Highlight your teamwork and collaboration skills")
        
        # Learning and growth mindset
        learning_indicators = ["learn", "grow", "develop", "improve", "enhance", "skill"]
        if any(word in response.lower() for word in learning_indicators):
            score += 6
            strengths.append("Shows learning and growth mindset")
        else:
            score += 2
            improvements.append("Express your commitment to learning and growth")
        
        # Confidence indicators
        confidence_indicators = ["confident", "sure", "certain", "believe", "know", "can"]
        confidence_count = sum(1 for word in confidence_indicators if word in response.lower())
        if confidence_count >= 2:
            score += 6
            strengths.append("Demonstrates confidence and self-assurance")
        elif confidence_count >= 1:
            score += 4
            strengths.append("Shows some confidence")
        else:
            score += 1
            improvements.append("Express more confidence in your abilities")
        
        # Specificity and concrete examples
        if any(char.isdigit() for char in response):
            score += 5
            strengths.append("Uses specific numbers and metrics")
        
        # Time references
        time_indicators = ["year", "month", "week", "quarter", "period"]
        if any(word in response.lower() for word in time_indicators):
            score += 4
            strengths.append("Provides time-specific examples")
        
        # Question-specific evaluation
        question_type = question.get("type", "")
        if question_type == "opening":
            if "background" in response.lower() or "experience" in response.lower():
                score += 5
                strengths.append("Effectively introduces background and experience")
        elif question_type == "motivation":
            if "interested" in response.lower() or "passion" in response.lower():
                score += 5
                strengths.append("Clearly expresses motivation and interest")
        elif question_type == "experience":
            if "challenge" in response.lower() or "problem" in response.lower():
                score += 5
                strengths.append("Describes challenging experiences effectively")
        
        # Generate comprehensive feedback
        feedback = self._generate_hr_feedback(score, strengths, improvements, question_type)
        
        return {
            "score": min(score, 100),
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements,
            "technical_depth": score * 0.3,  # HR responses have lower technical depth
            "problem_solving": score * 0.4,  # Moderate problem-solving emphasis
            "confidence_level": score * 0.5   # High confidence emphasis for HR
        }
    
    def _generate_hr_feedback(self, score: float, strengths: List[str], improvements: List[str], question_type: str) -> str:
        """Generate comprehensive HR feedback"""
        if score >= 85:
            overall_tone = "excellent"
            recommendation = "You're well-prepared for HR interviews. Continue building on your strengths."
        elif score >= 70:
            overall_tone = "good"
            recommendation = "You have solid HR interview skills. Focus on the areas for improvement."
        elif score >= 55:
            overall_tone = "fair"
            recommendation = "You have potential but need to work on several areas to improve your HR interview performance."
        else:
            overall_tone = "needs improvement"
            recommendation = "Significant improvement needed. Focus on the key areas identified."
        
        feedback = f"Your HR interview response was {overall_tone}. "
        
        if strengths:
            feedback += f"Your strengths include: {', '.join(strengths[:3])}. "
        
        if improvements:
            feedback += f"Areas for improvement: {', '.join(improvements[:3])}. "
        
        feedback += recommendation
        
        return feedback
    
    def _evaluate_tech_response(self, question: Dict[str, Any], response: str, keyword_score: float) -> Dict[str, Any]:
        """Evaluate technical interview response"""
        score = keyword_score * 50  # 50% for technical accuracy
        
        # Technical depth
        technical_terms = ["algorithm", "complexity", "optimization", "architecture", "scaling"]
        tech_depth = sum(1 for term in technical_terms if term in response.lower())
        score += tech_depth * 10
        
        # Structure and clarity
        if "first" in response.lower() and "then" in response.lower():
            score += 15
            strengths = ["Well-structured response"]
        else:
            score += 5
            improvements = ["Structure your response with clear steps"]
        
        # Examples and implementation
        if any(word in response.lower() for word in ["example", "instance", "case", "scenario"]):
            score += 15
            strengths = ["Good use of examples"]
        else:
            score += 5
            improvements = ["Provide concrete examples"]
        
        return {
            "score": min(score, 100),
            "strengths": strengths if 'strengths' in locals() else [],
            "improvements": improvements if 'improvements' in locals() else []
        }
    
    def _evaluate_puzzle_response(self, question: Dict[str, Any], response: str, keyword_score: float) -> Dict[str, Any]:
        """Evaluate puzzle interview response"""
        score = keyword_score * 30  # 30% for keywords
        
        # Logical approach
        logical_indicators = ["if", "then", "because", "therefore", "since", "assume"]
        logic_score = sum(1 for indicator in logical_indicators if indicator in response.lower())
        score += logic_score * 8
        
        # Step-by-step thinking
        if any(word in response.lower() for word in ["step", "first", "second", "finally"]):
            score += 20
            strengths = ["Shows systematic thinking"]
        else:
            score += 5
            improvements = ["Break down the problem into steps"]
        
        # Creativity and alternative approaches
        if any(word in response.lower() for word in ["alternative", "another", "different", "approach"]):
            score += 15
            strengths = ["Shows creative thinking"]
        else:
            score += 5
            improvements = ["Consider multiple approaches"]
        
        # Persistence and confidence
        if len(response.split()) > 30:
            score += 15
            strengths = ["Shows thorough analysis"]
        else:
            score += 5
            improvements = ["Provide more detailed analysis"]
        
        return {
            "score": min(score, 100),
            "strengths": strengths if 'strengths' in locals() else [],
            "improvements": improvements if 'improvements' in locals() else []
        }
    
    def _evaluate_case_study_response(self, question: Dict[str, Any], response: str, keyword_score: float) -> Dict[str, Any]:
        """Evaluate case study interview response"""
        score = keyword_score * 40  # 40% for keywords
        
        # Business understanding
        business_terms = ["impact", "revenue", "cost", "efficiency", "scalability", "market"]
        business_score = sum(1 for term in business_terms if term in response.lower())
        score += business_score * 8
        
        # Structured analysis
        if any(word in response.lower() for word in ["problem", "solution", "impact", "recommendation"]):
            score += 20
            strengths = ["Well-structured analysis"]
        else:
            score += 5
            improvements = ["Structure your analysis clearly"]
        
        # Quantitative thinking
        if any(word in response.lower() for word in ["percentage", "number", "increase", "decrease", "metric"]):
            score += 15
            strengths = ["Shows quantitative thinking"]
        else:
            score += 5
            improvements = ["Include quantitative analysis"]
        
        # Actionable recommendations
        if any(word in response.lower() for word in ["recommend", "suggest", "implement", "action"]):
            score += 15
            strengths = ["Provides actionable recommendations"]
        else:
            score += 5
            improvements = ["Provide specific recommendations"]
        
        return {
            "score": min(score, 100),
            "strengths": strengths if 'strengths' in locals() else [],
            "improvements": improvements if 'improvements' in locals() else []
        }
    
    def _evaluate_behavioral_response(self, question: Dict[str, Any], response: str, keyword_score: float) -> Dict[str, Any]:
        """Evaluate behavioral interview response using STAR method"""
        score = keyword_score * 35  # 35% for keywords
        
        # STAR method structure
        star_components = ["situation", "task", "action", "result"]
        star_score = sum(1 for component in star_components if component in response.lower())
        score += star_score * 15
        
        # Specific examples and details
        if any(word in response.lower() for word in ["when", "where", "who", "what", "how"]):
            score += 20
            strengths = ["Good use of specific details"]
        else:
            score += 5
            improvements = ["Provide specific details about the situation"]
        
        # Personal involvement
        if any(word in response.lower() for word in ["i", "me", "my", "we", "our"]):
            score += 15
            strengths = ["Shows personal involvement"]
        else:
            score += 5
            improvements = ["Focus on your personal role and actions"]
        
        # Outcomes and learning
        if any(word in response.lower() for word in ["result", "outcome", "learned", "improved", "achieved"]):
            score += 15
            strengths = ["Shows outcomes and learning"]
        else:
            score += 5
            improvements = ["Include the results and what you learned"]
        
        return {
            "score": min(score, 100),
            "strengths": strengths if 'strengths' in locals() else [],
            "improvements": improvements if 'improvements' in locals() else []
        }
    
    def _evaluate_system_design_response(self, question: Dict[str, Any], response: str, keyword_score: float) -> Dict[str, Any]:
        """Evaluate system design interview response"""
        score = keyword_score * 40  # 40% for keywords
        
        # Architecture components
        arch_components = ["database", "cache", "load_balancer", "api", "microservices", "monitoring"]
        arch_score = sum(1 for component in arch_components if component in response.lower())
        score += arch_score * 8
        
        # Scalability considerations
        if any(word in response.lower() for word in ["scale", "scalability", "performance", "throughput", "latency"]):
            score += 20
            strengths = ["Considers scalability"]
        else:
            score += 5
            improvements = ["Address scalability concerns"]
        
        # Trade-offs discussion
        if any(word in response.lower() for word in ["trade", "tradeoff", "pros", "cons", "advantage", "disadvantage"]):
            score += 15
            strengths = ["Discusses trade-offs"]
        else:
            score += 5
            improvements = ["Discuss trade-offs between different approaches"]
        
        # System thinking
        if any(word in response.lower() for word in ["component", "service", "layer", "interface", "protocol"]):
            score += 15
            strengths = ["Shows system-level thinking"]
        else:
            score += 5
            improvements = ["Think about system components and interactions"]
        
        return {
            "score": min(score, 100),
            "strengths": strengths if 'strengths' in locals() else [],
            "improvements": improvements if 'improvements' in locals() else []
        }

# Global interview mode manager
interview_mode_manager = InterviewModeManager() 