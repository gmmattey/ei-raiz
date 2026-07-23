import { calculateScore, ScoreRuleInput } from "./score.rules";
import { ScoreResult } from "./score.types";

export class ScoreService {
  run(input: ScoreRuleInput): ScoreResult {
    return calculateScore(input);
  }
}
