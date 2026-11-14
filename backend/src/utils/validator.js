let zodLib = null;
try {
  const zMod = await import('zod');
  zodLib = zMod.z || zMod.default;
} catch {
  zodLib = null;
}

export function validatePayload(schemaDefinition, payload) {
  if (zodLib && typeof schemaDefinition?.safeParse === 'function') {
    const res = schemaDefinition.safeParse(payload);
    if (!res.success) {
      return {
        success: false,
        errors: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      };
    }
    return { success: true, data: res.data };
  }

  // Deterministic schema validation when running with descriptor objects
  const errors = [];
  const data = { ...payload };
  if (schemaDefinition && typeof schemaDefinition === 'object') {
    for (const [field, rules] of Object.entries(schemaDefinition)) {
      const val = data[field];
      if (rules.required && (val === undefined || val === null || val === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      if (val !== undefined && val !== null) {
        if (rules.type === 'string' && typeof val !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (rules.type === 'number' && typeof val !== 'number' && Number.isNaN(Number(val))) {
          errors.push(`${field} must be a number`);
        } else if (rules.enum && !rules.enum.includes(val)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }
  return { success: true, data };
}
