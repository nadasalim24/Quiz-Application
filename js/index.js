import Quiz from './quiz.js';
import Question from './question.js';

const quizOptionsForm = document.getElementById('quizOptions');
const playerNameInput = document.getElementById('playerName');
const categoryInput = document.getElementById('categoryMenu');
const difficultyOptions = document.getElementById('difficultyOptions');
const questionsNumber = document.getElementById('questionsNumber');
const startQuizBtn = document.getElementById('startQuiz');
const questionsContainer = document.getElementById('questionsContainer');

let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn" id="retryBtn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;
  document.getElementById('retryBtn').addEventListener('click', resetToStart);
}

function validateForm() {
  const num = parseInt(questionsNumber.value);
  if (!num || num < 1 || num > 50) return { isValid: false, error: 'Please enter a number between 1 and 50' };
  return { isValid: true, error: null };
}

function showFormError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
  startQuizBtn.parentNode.insertBefore(errorDiv, startQuizBtn);
  setTimeout(() => errorDiv.remove(), 3000);
}

function resetToStart() {
  questionsContainer.innerHTML = '';
  quizOptionsForm.classList.remove('hidden');
  currentQuiz = null;
}

async function startQuiz() {
  const validation = validateForm();
  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  const playerName = playerNameInput.value.trim() || 'Player';
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numQuestions = parseInt(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numQuestions, playerName);
  quizOptionsForm.classList.add('hidden');
  showLoading();

  try {
    const questions = await currentQuiz.getQuestions();
    hideLoading();
    if (questions.length === 0) {
      showError("No questions found for this category. Try different settings.");
      return;
    }
    const firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError("Failed to fetch questions. Please try again.");
  }
}

startQuizBtn.addEventListener('click', startQuiz);
questionsNumber.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); 
    startQuiz();
  }
});