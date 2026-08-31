/**
 * SignBridge AI - Confidence Smoothing Algorithm
 * 
 * - Maintains a rolling buffer of the last N frame predictions (default: 10 frames).
 * - Only counts frames meeting the confidence threshold (default: 0.70); others are treated as null votes.
 * - Confirms and reports a majority-voted sign only if it secures >= majorityThreshold votes.
 */
export class ConfidenceSmoother {
  constructor(bufferSize = 10, confidenceThreshold = 0.70, majorityThreshold = 6) {
    this.bufferSize = bufferSize;
    this.confidenceThreshold = confidenceThreshold;
    this.majorityThreshold = majorityThreshold;
    this.buffer = [];
  }

  /**
   * Adds a new frame prediction to the rolling window.
   * @param {Object|null} prediction - { label: string, confidence: number, top3?: Array } or null if no hand
   * @returns {Object} smoothed result
   */
  addPrediction(prediction) {
    if (prediction && prediction.label && (prediction.confidence || 0) >= this.confidenceThreshold) {
      this.buffer.push({
        label: String(prediction.label),
        confidence: prediction.confidence || 0.8,
        top3: prediction.top3 || [],
        timestamp: Date.now()
      });
    } else {
      this.buffer.push(null);
    }

    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    return this.getSmoothedResult();
  }

  /**
   * Calculates the current majority vote in the buffer.
   */
  getSmoothedResult() {
    const voteCounts = {};
    const confidenceSums = {};

    for (const item of this.buffer) {
      if (item !== null) {
        voteCounts[item.label] = (voteCounts[item.label] || 0) + 1;
        confidenceSums[item.label] = (confidenceSums[item.label] || 0) + item.confidence;
      }
    }

    let topLabel = null;
    let maxVotes = 0;

    for (const [label, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        topLabel = label;
      }
    }

    const isStable = maxVotes >= this.majorityThreshold;
    const avgConfidence = isStable && maxVotes > 0
      ? confidenceSums[topLabel] / maxVotes
      : maxVotes > 0
      ? confidenceSums[topLabel] / maxVotes
      : 0;

    return {
      label: isStable ? topLabel : null,
      rawLabel: topLabel,
      confidence: avgConfidence,
      voteCount: maxVotes,
      bufferLength: this.buffer.length,
      isStable,
      voteDistribution: voteCounts
    };
  }

  reset() {
    this.buffer = [];
  }
}

export default ConfidenceSmoother;
