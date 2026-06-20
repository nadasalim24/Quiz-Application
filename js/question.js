
export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd; 
    
    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;
    
    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    
    this.wrongAnswers = this.questionData.incorrect_answers.map(ans => this.decodeHtml(ans));
    
    this.allAnswers = this.shuffleAnswers([...this.wrongAnswers, this.correctAnswer]);
    
    this.answered = false; 
    this.timerInterval = null;
    this.timeRemaining = 15; 
    this.handleKeyboard = this.handleKeyboard.bind(this);
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
  }

  shuffleAnswers(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const difficultyClass = this.quiz.difficulty || 'medium';
    const progress = this.getProgress();
    
    let answersHtml = '';
    this.allAnswers.forEach((ans, i) => {
      answersHtml += `
        <button class="answer-btn" data-answer="${ans.replace(/"/g, '&quot;')}">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text">${ans}</span>
        </button>
      `;
    });

    this.container.innerHTML = `
      <div class="game-card question-card">
        
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${progress}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.category}</span>
          </div>
          <div class="stat-badge difficulty ${difficultyClass}">
            <i class="fa-solid fa-face-smile"></i>
            <span>${difficultyClass}</span>
          </div>
          <div class="stat-badge timer" id="timerBadge">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value" id="timerValue">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
        </div>

        <h2 class="question-text">${this.question}</h2>

        <div class="answers-grid">
          ${answersHtml}
        </div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn));
    });

    document.addEventListener('keydown', this.handleKeyboard);
  }
  
  handleKeyboard(e) {
    if (this.answered) return;
    const key = e.key;
    if (key >= '1' && key <= this.allAnswers.length.toString()) {
      const index = parseInt(key) - 1;
      const buttons = this.container.querySelectorAll('.answer-btn');
      if (buttons[index]) {
        this.checkAnswer(buttons[index]);
      }
    }
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this.handleKeyboard);
  }

  startTimer() {
    const timerValue = this.container.querySelector('#timerValue');
    const timerBadge = this.container.querySelector('#timerBadge');
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerValue.textContent = this.timeRemaining;
      
      if (this.timeRemaining <= 5) {
        timerBadge.classList.add('warning');
      }
      
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    if (this.answered) return;
    this.answered = true;
    this.removeEventListeners();
    
    this.highlightCorrectAnswer();
    
    const grid = this.container.querySelector('.answers-grid');
    const timeUpMsg = document.createElement('div');
    timeUpMsg.className = 'time-up-message';
    timeUpMsg.innerHTML = `<i class="fa-solid fa-clock"></i> TIME'S UP!`;
    grid.parentNode.insertBefore(timeUpMsg, grid);

    this.playSound('wrong');
    this.animateQuestion(2000);
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selectedAnswer = choiceElement.getAttribute('data-answer');
    const isCorrect = selectedAnswer === this.correctAnswer;

    if (isCorrect) {
      choiceElement.classList.add('correct');
      this.quiz.incrementScore();
      this.playSound('correct');
    } else {
      choiceElement.classList.add('wrong');
      this.highlightCorrectAnswer();
      this.playSound('wrong');
    }

    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      if (btn !== choiceElement && btn.getAttribute('data-answer') !== this.correctAnswer) {
        btn.classList.add('disabled');
      }
    });

    const scoreDisplay = this.container.querySelector('.score-item-value');
    if (scoreDisplay) {
      scoreDisplay.textContent = this.quiz.score;
    }

    this.animateQuestion(2000);
  }

  highlightCorrectAnswer() {
    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-answer') === this.correctAnswer) {
        btn.classList.add('correct-reveal');
      }
    });
  }

  getNextQuestion() {
    const hasMore = this.quiz.nextQuestion();
    if (hasMore) {
      const nextQ = new Question(this.quiz, this.container, this.onQuizEnd);
      nextQ.displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();
      const playAgainBtn = this.container.querySelector('#playAgainBtn');
      if (playAgainBtn) {
        playAgainBtn.addEventListener('click', this.onQuizEnd);
      }
    }
  }

  animateQuestion(duration) {
    setTimeout(() => {
      const card = this.container.querySelector('.question-card');
      card.classList.add('exit');
      
      setTimeout(() => {
        this.getNextQuestion();
      }, 400); 
    }, duration);
  }

  playSound(type) {
    try {
      const audio = new Audio(`./sounds/${type}.mp3`);
      audio.play();
    } catch(e) {
    }
  }
}