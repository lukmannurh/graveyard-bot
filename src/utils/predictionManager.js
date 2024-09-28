let activeMatch = null;
let predictions = [];
let isSessionOpen = false;

const predictionManager = {
    startMatch: (team1, team2, reward) => {
        activeMatch = { team1, team2, reward };
        isSessionOpen = true;
        predictions = [];
    },

    endMatch: () => {
        isSessionOpen = false;
    },

    addPrediction: (userId, score, timestamp) => {
        if (isSessionOpen && !predictions.some(p => p.userId === userId)) {
            predictions.push({ userId, score, timestamp });
            return true;
        }
        return false;
    },

    removePrediction: (userId) => {
        predictions = predictions.filter(p => p.userId !== userId);
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

module.exports = predictionManager;