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
  data?: { proteinRemainingG: number; dietaryPrefs: string[]; ingredients?: string[] };
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

  // Validate optional ingredients
  let ingredients: string[] | undefined;
  if (obj.ingredients !== undefined) {
    if (!Array.isArray(obj.ingredients)) {
      errors.push({ field: "ingredients", message: "Must be an array" });
    } else if (obj.ingredients.length > 20) {
      errors.push({ field: "ingredients", message: "Maximum 20 ingredients allowed" });
    } else if (!obj.ingredients.every((i) => typeof i === "string")) {
      errors.push({ field: "ingredients", message: "All items must be strings" });
    } else {
      ingredients = obj.ingredients as string[];
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      proteinRemainingG: obj.proteinRemainingG as number,
      dietaryPrefs: obj.dietaryPrefs as string[],
      ingredients,
    },
  };
}
