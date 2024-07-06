export const getPercentage = ({ level, result }) => {
    let weights;
    switch (level) {
        case "beginner":
            weights = {
                relevance: 5.5,
                completeness: 1.5,
                accuracy: 1.5,
                clarity: 1,
                communication: 0.5
            };
            break;
        case "intermediate":
            weights = {
                relevance: 5,
                completeness: 1.7,
                accuracy: 1.6,
                clarity: 1,
                communication: 0.7
            };
            break;
        case "advanced":
            weights = {
                relevance: 5,
                completeness: 1.7,
                accuracy: 1.7,
                clarity: 1.2,
                communication: 0.4
            };
            break;
        default:
            // Default weights for unknown levels
            weights = {
                relevance: 4.5,
                completeness: 1.9,
                accuracy: 1.9,
                clarity: 1.2,
                communication: 0.5
            };
    }

    const { clarity, accuracy, completeness, relevance, communication } = result;

    // Calculate the weighted sum
    const weightedSum = (
        (relevance * weights.relevance) +
        (clarity * weights.clarity) +
        (completeness * weights.completeness) +
        (accuracy * weights.accuracy) +
        (communication * weights.communication)
    );

    return Math.floor(weightedSum);
};
