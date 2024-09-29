import logger from './logger.js';

let activeMatch = null;
let predictions = [];
let isSessionOpen = false;

export const predictionManager = {
  startMatch: (team1, team2, reward) => {
    activeMatch = { team1, team2, reward };
    isSessionOpen = true;
    predictions = [];
    logger.info(`Match started: ${team1} VS ${team2}, Reward: ${reward}`);
  },

  endMatch: () => {
    isSessionOpen = false;
    logger.info('Match ended');
  },

  addPrediction: (userId, score, timestamp, manualName = null) => {
    if (isSessionOpen && !predictions.some(p => p.userId === userId)) {
      predictions.push({ userId, score, timestamp, manualName });
      logger.info(`Prediction added: User ${userId}, Score: ${score}`);
      return true;
    }
    logger.warn(`Failed to add prediction: User ${userId}, Score: ${score}`);
    return false;
  },

  removePrediction: (userId) => {
    predictions = predictions.filter(p => p.userId !== userId);
    logger.info(`Prediction removed for user: ${userId}`);
  },

  hasUserPredicted: (userId) => {
    return predictions.some(p => p.userId === userId);
  },

  isPredictionExist: (score) => {
    return predictions.some(p => p.score === score);
  },

  getPredictionByScore: (score) => {
    return predictions.find(p => p.score === score);
  },

  getActiveMatch: () => activeMatch || { team1: 'Unknown', team2: 'Unknown', reward: 'Unknown' },
  getPredictions: () => predictions,
  isSessionActive: () => isSessionOpen
};

export default predictionManager;