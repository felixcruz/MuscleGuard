/**
 * API Request Validation Utilities
 * Ensures request bodies match expected types
 */

export interface ValidationError {
  field: string;
  message: string;
}

export function validateMealGenerationRequest(data: unknown): {
  valid: boolean;
  data?: { proteinRemainingG: number; dietaryPrefs: string[] };
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: [{ field: "body", message: "Request body must be an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  // Validate proteinRemainingG
  if (typeof obj.proteinRemainingG !== "number") {
    errors.push({
      field: "proteinRemainingG",
      message: "Must be a number",
    });
  } else if (obj.proteinRemainingG < 0 || obj.proteinRemainingG > 500) {
    errors.push({
      field: "proteinRemainingG",
      message: "Must be between 0 and 500",
    });
  }

  // Validate dietaryPrefs
  if (!Array.isArray(obj.dietaryPrefs)) {
    errors.push({
      field: "dietaryPrefs",
      message: "Must be an array",
    });
  } else if (!obj.dietaryPrefs.every((p) => typeof p === "string")) {
    errors.push({
      field: "dietaryPrefs",
      message: "All items must be strings",
    });
  } else if (obj.dietaryPrefs.length > 10) {
    errors.push({
      field: "dietaryPrefs",
      message: "Maximum 10 dietary preferences allowed",
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      proteinRemainingG: obj.proteinRemainingG as number,
      dietaryPrefs: obj.dietaryPrefs as string[],
    },
  };
}
