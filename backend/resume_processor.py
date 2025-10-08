import PyPDF2
import docx
import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import os
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeProcessor:
    def __init__(self):
        # Common skills database
        self.skills_database = {
            "programming_languages": [
                "python", "javascript", "java", "c++", "c#", "php", "ruby", "go", "rust", "swift",
                "kotlin", "scala", "r", "matlab", "perl", "bash", "powershell", "sql", "html", "css"
            ],
            "frameworks": [
                "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "laravel",
                "asp.net", "ruby on rails", "fastapi", "tensorflow", "pytorch", "scikit-learn", "pandas",
                "numpy", "bootstrap", "tailwind", "material-ui"
            ],
            "databases": [
                "mysql", "postgresql", "mongodb", "redis", "sqlite", "oracle", "sql server", "dynamodb",
                "cassandra", "elasticsearch", "neo4j", "firebase"
            ],
            "cloud_platforms": [
                "aws", "azure", "google cloud", "heroku", "digitalocean", "linode", "vultr", "firebase",
                "vercel", "netlify", "docker", "kubernetes"
            ],
            "tools": [
                "git", "github", "gitlab", "jenkins", "jira", "confluence", "slack", "trello", "asana",
                "postman", "swagger", "figma", "adobe", "photoshop", "illustrator", "sketch"
            ],
            "methodologies": [
                "agile", "scrum", "kanban", "waterfall", "devops", "ci/cd", "tdd", "bdd", "lean",
                "six sigma", "prince2", "pmp"
            ]
        }
        
        # Job role requirements
        self.role_requirements = {
            "Software Engineer": {
                "required_skills": ["programming", "algorithms", "data structures", "git"],
                "preferred_skills": ["cloud", "docker", "kubernetes", "microservices"],
                "experience_level": "mid",
                "technical_focus": True
            },
            "Data Scientist": {
                "required_skills": ["python", "statistics", "machine learning", "sql"],
                "preferred_skills": ["deep learning", "nlp", "computer vision", "big data"],
                "experience_level": "mid",
                "technical_focus": True
            },
            "Product Manager": {
                "required_skills": ["product strategy", "user research", "agile", "analytics"],
                "preferred_skills": ["technical background", "design thinking", "stakeholder management"],
                "experience_level": "mid",
                "technical_focus": False
            },
            "UX Designer": {
                "required_skills": ["user research", "wireframing", "prototyping", "design systems"],
                "preferred_skills": ["figma", "sketch", "adobe", "usability testing"],
                "experience_level": "mid",
                "technical_focus": False
            },
            "DevOps Engineer": {
                "required_skills": ["linux", "docker", "kubernetes", "ci/cd", "cloud"],
                "preferred_skills": ["terraform", "ansible", "jenkins", "monitoring"],
                "experience_level": "mid",
                "technical_focus": True
            }
        }
    
    def process_resume(self, file_path: str) -> Dict[str, Any]:
        """Process resume file and extract information"""
        try:
            file_extension = Path(file_path).suffix.lower()
            
            if file_extension == '.pdf':
                text = self._extract_text_from_pdf(file_path)
            elif file_extension in ['.docx', '.doc']:
                text = self._extract_text_from_docx(file_path)
            elif file_extension == '.txt':
                text = self._extract_text_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            # Extract information from text
            extracted_info = self._extract_information(text)
            
            return {
                "success": True,
                "text": text,
                "extracted_info": extracted_info,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing resume: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    def _extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            raise
    
    def _extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {e}")
            raise
    
    def _extract_information(self, text: str) -> Dict[str, Any]:
        """Extract structured information from resume text"""
        text_lower = text.lower()
        
        extracted_info = {
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "skills": self._extract_skills(text_lower),
            "experience": self._extract_experience(text),
            "education": self._extract_education(text),
            "projects": self._extract_projects(text),
            "certifications": self._extract_certifications(text_lower)
        }
        
        return extracted_info
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Extract name from resume"""
        # Simple name extraction - look for patterns like "Name: John Doe" or "JOHN DOE"
        lines = text.split('\n')
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if re.match(r'^[A-Z][a-z]+ [A-Z][a-z]+$', line):
                return line
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email from resume"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group() if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from resume"""
        phone_pattern = r'(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        match = re.search(phone_pattern, text)
        if match:
            return ''.join(match.groups())
        return None
    
    def _extract_skills(self, text_lower: str) -> Dict[str, List[str]]:
        """Extract skills from resume text"""
        skills = {category: [] for category in self.skills_database.keys()}
        
        for category, skill_list in self.skills_database.items():
            for skill in skill_list:
                if skill in text_lower:
                    skills[category].append(skill)
        
        return skills
    
    def _extract_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience from resume"""
        experience = []
        
        # Look for experience patterns
        experience_patterns = [
            r'(\d{4})\s*[-–]\s*(\d{4}|present|current)',
            r'(\w+ \d{4})\s*[-–]\s*(\w+ \d{4}|present|current)'
        ]
        
        lines = text.split('\n')
        for i, line in enumerate(lines):
            for pattern in experience_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    # Extract company and role from surrounding lines
                    role = self._extract_role_from_context(lines, i)
                    company = self._extract_company_from_context(lines, i)
                    
                    if role or company:
                        experience.append({
                            "role": role or "Unknown",
                            "company": company or "Unknown",
                            "duration": line.strip()
                        })
                    break
        
        return experience
    
    def _extract_role_from_context(self, lines: List[str], index: int) -> Optional[str]:
        """Extract job role from context around experience line"""
        # Check previous and next lines for role information
        for i in range(max(0, index-2), min(len(lines), index+3)):
            line = lines[i].strip()
            if line and not re.search(r'\d{4}', line):
                return line
        return None
    
    def _extract_company_from_context(self, lines: List[str], index: int) -> Optional[str]:
        """Extract company name from context around experience line"""
        # Look for company patterns
        for i in range(max(0, index-3), min(len(lines), index+4)):
            line = lines[i].strip()
            if line and re.search(r'(inc|corp|llc|ltd|company|co\.)', line, re.IGNORECASE):
                return line
        return None
    
    def _extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information from resume"""
        education = []
        
        # Look for education patterns
        education_keywords = ['university', 'college', 'school', 'bachelor', 'master', 'phd', 'degree']
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in education_keywords):
                education.append({
                    "institution": line.strip(),
                    "degree": self._extract_degree(line),
                    "year": self._extract_year(line)
                })
        
        return education
    
    def _extract_degree(self, text: str) -> Optional[str]:
        """Extract degree from education line"""
        degree_patterns = [r'bachelor', r'master', r'phd', r'associate', r'certificate']
        for pattern in degree_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return pattern.title()
        return None
    
    def _extract_year(self, text: str) -> Optional[str]:
        """Extract year from education line"""
        year_pattern = r'\b(19|20)\d{2}\b'
        match = re.search(year_pattern, text)
        return match.group() if match else None
    
    def _extract_projects(self, text: str) -> List[Dict[str, str]]:
        """Extract projects from resume"""
        projects = []
        
        # Look for project patterns
        project_keywords = ['project', 'developed', 'built', 'created', 'implemented']
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in project_keywords):
                projects.append({
                    "title": line.strip(),
                    "description": self._extract_project_description(lines, lines.index(line))
                })
        
        return projects
    
    def _extract_project_description(self, lines: List[str], index: int) -> str:
        """Extract project description from context"""
        description = ""
        for i in range(index+1, min(len(lines), index+4)):
            line = lines[i].strip()
            if line and not re.search(r'\d{4}', line):
                description += line + " "
        return description.strip()
    
    def _extract_certifications(self, text_lower: str) -> List[str]:
        """Extract certifications from resume"""
        certifications = []
        
        cert_keywords = ['certified', 'certification', 'certificate', 'aws', 'azure', 'google', 'pmp']
        
        lines = text_lower.split('\n')
        for line in lines:
            if any(keyword in line for keyword in cert_keywords):
                certifications.append(line.strip())
        
        return certifications
    
    def match_skills_to_role(self, extracted_info: Dict[str, Any], role: str) -> Dict[str, Any]:
        """Match extracted skills to job role requirements"""
        if role not in self.role_requirements:
            return {"error": f"Role '{role}' not found in requirements database"}
        
        role_req = self.role_requirements[role]
        all_skills = []
        
        # Flatten skills from all categories
        for category_skills in extracted_info.get("skills", {}).values():
            all_skills.extend(category_skills)
        
        # Calculate matches
        required_matches = []
        preferred_matches = []
        missing_required = []
        missing_preferred = []
        
        for skill in role_req["required_skills"]:
            if skill in all_skills:
                required_matches.append(skill)
            else:
                missing_required.append(skill)
        
        for skill in role_req["preferred_skills"]:
            if skill in all_skills:
                preferred_matches.append(skill)
            else:
                missing_preferred.append(skill)
        
        # Calculate match percentage
        required_match_percentage = len(required_matches) / len(role_req["required_skills"]) * 100
        preferred_match_percentage = len(preferred_matches) / len(role_req["preferred_skills"]) * 100 if role_req["preferred_skills"] else 100
        
        overall_match = (required_match_percentage * 0.7) + (preferred_match_percentage * 0.3)
        
        return {
            "role": role,
            "overall_match_percentage": round(overall_match, 2),
            "required_match_percentage": round(required_match_percentage, 2),
            "preferred_match_percentage": round(preferred_match_percentage, 2),
            "required_matches": required_matches,
            "preferred_matches": preferred_matches,
            "missing_required": missing_required,
            "missing_preferred": missing_preferred,
            "recommendations": self._generate_skill_recommendations(missing_required, missing_preferred, role)
        }
    
    def _generate_skill_recommendations(self, missing_required: List[str], missing_preferred: List[str], role: str) -> List[str]:
        """Generate skill improvement recommendations"""
        recommendations = []
        
        if missing_required:
            recommendations.append(f"Focus on acquiring required skills: {', '.join(missing_required[:3])}")
        
        if missing_preferred:
            recommendations.append(f"Consider learning preferred skills: {', '.join(missing_preferred[:3])}")
        
        # Role-specific recommendations
        if role == "Software Engineer":
            recommendations.append("Practice coding problems on platforms like LeetCode or HackerRank")
            recommendations.append("Build personal projects to showcase your technical skills")
        elif role == "Data Scientist":
            recommendations.append("Work on data science projects and publish on GitHub")
            recommendations.append("Learn advanced ML techniques and participate in Kaggle competitions")
        elif role == "Product Manager":
            recommendations.append("Develop strong analytical and communication skills")
            recommendations.append("Gain experience with product analytics tools")
        
        return recommendations

# Global processor instance
resume_processor = ResumeProcessor()