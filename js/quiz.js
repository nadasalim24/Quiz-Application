export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  buildApiUrl() {
    let url = `https://opentdb.com/api.php?amount=${this.numberOfQuestions}`;
    if (this.category) url += `&category=${this.category}`;
    if (this.difficulty) url += `&difficulty=${this.difficulty}`;
    return url;
  }

  async getQuestions() {
    try {
      const response = await fetch(this.buildApiUrl());
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.response_code !== 0) throw new Error('No Results or API Error');
      this.questions = data.results;
      return this.questions;
    } catch (error) {
      console.error("Fetch error: ", error);
      throw error;
    }
  }

  incrementScore() {
    this.score++;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] || null;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.numberOfQuestions;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  getHighScores() {
    try {
      const scores = localStorage.getItem('quizHighScores');
      return scores ? JSON.parse(scores) : [];
    } catch (e) {
      return [];
    }
  }

  isHighScore() {
    const highScores = this.getHighScores();
    const percentage = this.getScorePercentage();
    if (highScores.length < 10) return true;
    return percentage > highScores[highScores.length - 1].percentage;
  }

  saveHighScore() {
    const highScores = this.getHighScores();
    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toISOString()
    };
    highScores.push(newScore);
    highScores.sort((a, b) => b.percentage - a.percentage);
    highScores.splice(10);
    localStorage.setItem('quizHighScores', JSON.stringify(highScores));
  }

  endQuiz() {
    const percentage = this.getScorePercentage();
    const isNewHigh = this.isHighScore();
    if (isNewHigh) this.saveHighScore();
    const highScores = this.getHighScores();
    
    let leaderboardHtml = highScores.map((s, index) => {
      let medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
      return `
        <li class="leaderboard-item ${medalClass}">
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${s.name}</span>
          <span class="leaderboard-score">${s.percentage}%</span>
        </li>
      `;
    }).join('');

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        ${isNewHigh ? `<div class="new-record-badge"><i class="fa-solid fa-star"></i> New High Score!</div>` : ''}
        <div class="leaderboard">
          <h4 class="leaderboard-title"><i class="fa-solid fa-trophy"></i> Leaderboard</h4>
          <ul class="leaderboard-list">${leaderboardHtml}</ul>
        </div>
        <div class="action-buttons">
          <button class="btn-restart" id="playAgainBtn">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}