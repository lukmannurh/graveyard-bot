let activeMatch = null;
let predictions = {};
let isSessionOpen = false;

const predictionManager = {
    startMatch: (team1, team2, reward) => {
        activeMatch = { team1, team2, reward };
        isSessionOpen = true;
        predictions = {};
    },

    endMatch: () => {
        isSessionOpen = false;
    },

    addPrediction: (userId, prediction) => {
        if (isSessionOpen && !predictions[userId]) {
            predictions[userId] = prediction;
            return true;
        }
        return false;
    },

    getActiveMatch: () => activeMatch,
    getPredictions: () => predictions,
    isSessionActive: () => isSessionOpen
};

module.exports = predictionManager;