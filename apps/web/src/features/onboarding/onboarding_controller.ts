import type { ProfileContextPayload, ProfileContextStep, ProfileOnboardingState, ProfileContextPutData } from '../../core/data/contracts';
import type { ProfileDataSource } from '../../core/data/data_sources';

export type OnboardingDraft = Partial<ProfileContextPayload>;

export interface OnboardingReview {
  readyToConfirm: boolean;
  missing: string[];
  summary: Record<string, unknown>;
}

export interface OnboardingController {
  load(): ReturnType<ProfileDataSource['getProfileContext']>;
  submitStep(step: Exclude<ProfileContextStep, 'confirm'>, patch: OnboardingDraft): ReturnType<ProfileDataSource['putProfileContext']>;
  review(draft: OnboardingDraft, onboarding: ProfileOnboardingState): OnboardingReview;
  confirm(draft: OnboardingDraft): Promise<{ ok: boolean; data?: ProfileContextPutData; nextPathname: string }>;
}

/**
 * Controller headless do onboarding.
 * Sem UI: a tela apenas chama `submitStep`, usa `review` local, e finaliza com `confirm`.
 */
export function createOnboardingController(input: { profile: ProfileDataSource }): OnboardingController {
  const profile = input.profile;

  return {
    load() {
      return profile.getProfileContext();
    },
    submitStep(step, patch) {
      return profile.putProfileContext({
        step,
        context: patch
      });
    },
    review(draft, onboarding) {
      const missing = onboarding.missing ?? [];
      const readyToConfirm = missing.length === 0 && isDraftCompleteEnough(draft);

      return {
        readyToConfirm,
        missing,
        summary: {
          financialGoal: draft.financialGoal ?? null,
          monthlyIncomeRange: draft.monthlyIncomeRange ?? null,
          investmentHorizon: draft.investmentHorizon ?? null,
          riskProfileSelfDeclared: draft.riskProfileSelfDeclared ?? null,
          platformsUsed: draft.platformsUsed ?? null
        }
      };
    },
    async confirm(draft) {
      const result = await profile.putProfileContext({
        step: 'confirm',
        context: draft
      });

      if (!result.ok) {
        return { ok: false, nextPathname: '/onboarding' };
      }

      const nextPathname = result.data.onboarding.homeUnlocked ? '/home' : '/onboarding';
      return { ok: true, data: result.data, nextPathname };
    }
  };
}

function isDraftCompleteEnough(draft: OnboardingDraft): boolean {
  // Critico para destravar leitura: goal + risk + horizon + platforms + income.
  return Boolean(
    draft.financialGoal &&
    draft.monthlyIncomeRange &&
    draft.investmentHorizon &&
    (draft.riskProfileEffective || draft.riskProfileQuizResult || draft.riskProfileSelfDeclared) &&
    draft.platformsUsed &&
    Array.isArray(draft.platformsUsed.platformIds) &&
    draft.platformsUsed.platformIds.length > 0
  );
}

