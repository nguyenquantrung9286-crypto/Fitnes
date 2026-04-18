import { createContext, useContext, useState, ReactNode } from "react";
import { UserSettings } from "@/types";

type OnboardingContextType = {
  currentStep: number;
  totalSteps: number;
  settings: Partial<UserSettings>;
  setSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  calculateBMI: () => void;
  calculateDailyCalories: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const TOTAL_STEPS = 6;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    onboarding_step: 0,
  });

  const setSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
      setSettings((prev) => ({
        ...prev,
        onboarding_step: (prev.onboarding_step ?? 0) + 1,
      }));
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setSettings((prev) => ({
        ...prev,
        onboarding_step: Math.max(0, (prev.onboarding_step ?? 1) - 1),
      }));
    }
  };

  const calculateBMI = () => {
    const heightM = (settings.height_cm ?? 0) / 100;
    const weight = settings.weight_kg ?? 0;
    if (heightM > 0 && weight > 0) {
      const bmi = weight / (heightM * heightM);
      setSettings((prev) => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
    }
  };

  const calculateDailyCalories = () => {
    const weight = settings.weight_kg ?? 70;
    const height = settings.height_cm ?? 170;
    
    // Calculate real age from birth_date
    const birthDate = settings.birth_date ? new Date(settings.birth_date) : null;
    const age = birthDate
      ? Math.max(13, Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400 * 1000)))
      : 30;

    const isMale = settings.gender === "male";

    // Mifflin-St Jeor equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += isMale ? 5 : -161;

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const multiplier =
      activityMultipliers[settings.activity_level ?? "moderate"] ?? 1.55;

    const tdee = Math.round(bmr * multiplier);

    // Adjust based on goal
    let targetCalories = tdee;
    if (settings.goal === "weight_loss") {
      targetCalories = tdee - 500;
    } else if (settings.goal === "muscle_gain") {
      targetCalories = tdee + 300;
    }

    // Macro split: 30% protein, 25% fat, 45% carbs
    const proteinG = Math.round((targetCalories * 0.3) / 4);
    const fatG = Math.round((targetCalories * 0.25) / 9);
    const carbsG = Math.round((targetCalories * 0.45) / 4);

    setSettings((prev) => ({
      ...prev,
      daily_calories: targetCalories,
      daily_protein_g: proteinG,
      daily_fat_g: fatG,
      daily_carbs_g: carbsG,
    }));
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        totalSteps: TOTAL_STEPS,
        settings,
        setSetting,
        nextStep,
        prevStep,
        calculateBMI,
        calculateDailyCalories,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
