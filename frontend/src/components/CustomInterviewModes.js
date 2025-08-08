import React, { useState, useEffect } from 'react';
import config from '../config';
import './CustomInterviewModes.css';

const CustomInterviewModes = ({ onModeSelect, onQuestionsGenerated }) => {
    const [availableModes, setAvailableModes] = useState({});
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedRole, setSelectedRole] = useState('Software Engineer');
    const [difficulty, setDifficulty] = useState('medium');
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const roles = [
        'Software Engineer',
        'Data Scientist',
        'Product Manager',
        'UX Designer',
        'DevOps Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Machine Learning Engineer',
        'Data Engineer',
        'QA Engineer',
        'System Administrator'
    ];

    const difficulties = [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' }
    ];

    useEffect(() => {
        fetchInterviewModes();
    }, []);

    const fetchInterviewModes = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/interview-modes`);
            if (response.ok) {
                const data = await response.json();
                setAvailableModes(data.modes);
            } else {
                setError('Failed to fetch interview modes');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        }
    };

    const handleModeSelect = (mode) => {
        setSelectedMode(mode);
        setQuestions([]);
        setError(null);
        onModeSelect && onModeSelect(mode);
    };

    const generateQuestions = async () => {
        if (!selectedMode) {
            setError('Please select an interview mode first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${config.BACKEND_URL}/api/interview-modes/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mode: selectedMode,
                    role: selectedRole,
                    difficulty: difficulty
                })
            });

            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions);
                onQuestionsGenerated && onQuestionsGenerated(data.questions, data.config);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to generate questions');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getAISuggestedQuestions = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${config.BACKEND_URL}/api/llm/suggest-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: selectedRole,
                    difficulty: difficulty,
                    question_type: selectedMode === 'tech' ? 'technical' : 
                                  selectedMode === 'hr' ? 'behavioral' : 'general'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions.map(q => ({ question: q, type: 'ai_suggested' })));
                onQuestionsGenerated && onQuestionsGenerated(data.questions, { name: 'AI Suggested' });
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to get AI suggestions');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getModeIcon = (mode) => {
        const icons = {
            hr: '👥',
            tech: '💻',
            puzzle: '🧩',
            case_study: '📊',
            behavioral: '🎯',
            system_design: '🏗️'
        };
        return icons[mode] || '❓';
    };

    const getModeColor = (mode) => {
        const colors = {
            hr: '#3b82f6',
            tech: '#10b981',
            puzzle: '#f59e0b',
            case_study: '#8b5cf6',
            behavioral: '#ef4444',
            system_design: '#06b6d4'
        };
        return colors[mode] || '#6b7280';
    };

    return (
        <div className="custom-interview-modes-container">
            <div className="modes-header">
                <div className="header-icon">
                    <div className="target-icon">
                        <div className="target-outer"></div>
                        <div className="target-middle"></div>
                        <div className="target-center"></div>
                        <div className="arrow"></div>
                    </div>
                </div>
                <h2>Choose Interview Mode</h2>
                <p>Select the type of interview that best matches your preparation level and career goals.</p>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}



            <div className="configuration-panel">
                <div className="config-section">
                    <label>Target Role:</label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="config-select"
                    >
                        {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                <div className="config-section">
                    <label>Difficulty Level:</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="config-select"
                    >
                        {difficulties.map(diff => (
                            <option key={diff.value} value={diff.value}>{diff.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="modes-grid">
                {Object.entries(availableModes).map(([modeKey, modeData]) => (
                    <div
                        key={modeKey}
                        className={`mode-card ${selectedMode === modeKey ? 'selected' : ''}`}
                        onClick={() => handleModeSelect(modeKey)}
                        style={{ borderColor: getModeColor(modeKey) }}
                    >
                        <div className="mode-icon" style={{ backgroundColor: getModeColor(modeKey) }}>
                            {getModeIcon(modeKey)}
                        </div>
                        <div className="mode-content">
                            <h4>{modeData.name}</h4>
                            <p>{modeData.description}</p>
                            <div className="mode-details">
                                <span className="duration">⏱️ {modeData.duration} min</span>
                                <span className="focus">🎯 {modeData.focus_areas?.length || 0} focus areas</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedMode && (
                <div className="question-generation-section">
                    <div className="generation-controls">
                        <button
                            onClick={generateQuestions}
                            disabled={isLoading}
                            className="generate-button"
                        >
                            {isLoading ? 'Generating...' : 'Generate Questions'}
                        </button>
                        <button
                            onClick={getAISuggestedQuestions}
                            disabled={isLoading}
                            className="ai-suggest-button"
                        >
                            {isLoading ? 'Getting AI Suggestions...' : 'Get AI Suggestions'}
                        </button>
                    </div>

                    {questions.length > 0 && (
                        <div className="questions-display">
                            <div className="questions-header">
                                <h4>Generated Questions</h4>
                                <span className="question-count">{questions.length} questions</span>
                            </div>
                            
                            <div className="questions-list">
                                {questions.map((question, index) => (
                                    <div key={index} className="question-item">
                                        <div className="question-header">
                                            <span className="question-number">Q{index + 1}</span>
                                            {question.type && (
                                                <span className={`question-type ${question.type}`}>
                                                    {question.type === 'ai_suggested' ? '🤖 AI' : question.type}
                                                </span>
                                            )}
                                            {question.difficulty && (
                                                <span className={`difficulty-badge ${question.difficulty}`}>
                                                    {question.difficulty}
                                                </span>
                                            )}
                                        </div>
                                        <p className="question-text">
                                            {question.question || question}
                                        </p>
                                        {question.expected_keywords && (
                                            <div className="expected-keywords">
                                                <span className="keywords-label">Expected Keywords:</span>
                                                <div className="keywords-list">
                                                    {question.expected_keywords.map((keyword, idx) => (
                                                        <span key={idx} className="keyword-tag">{keyword}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {question.time_limit && (
                                            <div className="time-limit">
                                                ⏱️ Time Limit: {question.time_limit} seconds
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedMode && availableModes[selectedMode] && (
                <div className="mode-info-panel">
                    <h4>About {availableModes[selectedMode].name}</h4>
                    <div className="info-content">
                        <p>{availableModes[selectedMode].description}</p>
                        <div className="focus-areas">
                            <h5>Focus Areas:</h5>
                            <div className="focus-tags">
                                {availableModes[selectedMode].focus_areas?.map((area, index) => (
                                    <span key={index} className="focus-tag">{area}</span>
                                ))}
                            </div>
                        </div>
                        <div className="scoring-criteria">
                            <h5>Scoring Criteria:</h5>
                            <div className="scoring-tags">
                                {availableModes[selectedMode].scoring_criteria?.map((criterion, index) => (
                                    <span key={index} className="scoring-tag">{criterion}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomInterviewModes; 