/**
 * Tenant Branding Validation & Sanitization (Task B1 / S5 Hardening)
 * Enforces strict write-time and read-time validation:
 * - Colors: strict hex pattern (#rgb, #rgba, #rrggbb, #rrggbbaa)
 * - URLs: https:// only or root-relative paths (/assets/...) - rejects javascript:, data:, http:
 * - Font: safe alphanumeric list - strictly rejects CSS injection characters (;, {}, quotes, tags)
 */

export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
export const SAFE_FONT_REGEX = /^[a-zA-Z0-9\s,_-]{1,60}$/;
const FORBIDDEN_FONT_CHARS = [';', '{', '}', '(', ')', '<', '>', '"', "'", '\\', '/', '@', '!', ':'];

export function isValidHexColor(val) {
  if (typeof val !== 'string') return false;
  return HEX_COLOR_REGEX.test(val.trim());
}

export function isValidHttpsOrRelativeUrl(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;

  // Explicitly reject dangerous URI schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  // Root-relative paths for first-party static assets
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !trimmed.includes('\0') && !trimmed.includes('\\');
  }

  // Absolute URLs must strictly be https://
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidFontFamily(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return false;
  if (!SAFE_FONT_REGEX.test(trimmed)) return false;
  return !FORBIDDEN_FONT_CHARS.some((char) => trimmed.includes(char));
}

/**
 * Validates branding at write time (createTenant / updateTenant).
 * Throws detailed error if any field contains invalid formats or injection strings.
 */
export function validateBrandingAtWriteTime(branding) {
  if (!branding || typeof branding !== 'object' || Array.isArray(branding)) {
    return {};
  }

  const validated = { ...branding };

  if (validated.primary_color !== undefined && validated.primary_color !== null) {
    if (!isValidHexColor(validated.primary_color)) {
      const err = new Error(
        `Invalid branding primary_color: "${validated.primary_color}". Must be a valid hex color string (e.g. #00e5ff)`
      );
      err.code = 'INVALID_BRANDING_PRIMARY_COLOR';
      err.statusCode = 400;
      throw err;
    }
    validated.primary_color = validated.primary_color.trim();
  }

  if (validated.secondary_color !== undefined && validated.secondary_color !== null) {
    if (!isValidHexColor(validated.secondary_color)) {
      const err = new Error(
        `Invalid branding secondary_color: "${validated.secondary_color}". Must be a valid hex color string (e.g. #9b8cff)`
      );
      err.code = 'INVALID_BRANDING_SECONDARY_COLOR';
      err.statusCode = 400;
      throw err;
    }
    validated.secondary_color = validated.secondary_color.trim();
  }

  if (validated.logo_url !== undefined && validated.logo_url !== null) {
    if (!isValidHttpsOrRelativeUrl(validated.logo_url)) {
      const err = new Error(
        `Invalid branding logo_url: "${validated.logo_url}". Must be an https:// URL or relative asset path`
      );
      err.code = 'INVALID_BRANDING_LOGO_URL';
      err.statusCode = 400;
      throw err;
    }
    validated.logo_url = validated.logo_url.trim();
  }

  if (validated.favicon_url !== undefined && validated.favicon_url !== null) {
    if (!isValidHttpsOrRelativeUrl(validated.favicon_url)) {
      const err = new Error(
        `Invalid branding favicon_url: "${validated.favicon_url}". Must be an https:// URL or relative asset path`
      );
      err.code = 'INVALID_BRANDING_FAVICON_URL';
      err.statusCode = 400;
      throw err;
    }
    validated.favicon_url = validated.favicon_url.trim();
  }

  if (validated.font_family !== undefined && validated.font_family !== null) {
    if (!isValidFontFamily(validated.font_family)) {
      const err = new Error(
        `Invalid branding font_family: "${validated.font_family}". Must be an alphanumeric font list without CSS injection characters`
      );
      err.code = 'INVALID_BRANDING_FONT_FAMILY';
      err.statusCode = 400;
      throw err;
    }
    validated.font_family = validated.font_family.trim();
  }

  if (validated.app_name !== undefined && validated.app_name !== null) {
    if (typeof validated.app_name !== 'string' || validated.app_name.includes('<') || validated.app_name.includes('>')) {
      const err = new Error('Invalid branding app_name: HTML characters are forbidden');
      err.code = 'INVALID_BRANDING_APP_NAME';
      err.statusCode = 400;
      throw err;
    }
    validated.app_name = validated.app_name.trim().slice(0, 80);
  }

  return validated;
}

/**
 * Sanitizes branding at read time (/api/v1/tenant/config).
 * Strips non-whitelisted fields and any field containing invalid formats or injection strings.
 */
export function sanitizeBrandingAtReadTime(rawBranding) {
  if (!rawBranding || typeof rawBranding !== 'object' || Array.isArray(rawBranding)) {
    return {};
  }

  const sanitized = {};

  if (typeof rawBranding.app_name === 'string' && !rawBranding.app_name.includes('<') && !rawBranding.app_name.includes('>')) {
    sanitized.app_name = rawBranding.app_name.trim().slice(0, 80);
  }

  if (isValidHexColor(rawBranding.primary_color)) {
    sanitized.primary_color = rawBranding.primary_color.trim();
  }

  if (isValidHexColor(rawBranding.secondary_color)) {
    sanitized.secondary_color = rawBranding.secondary_color.trim();
  }

  if (isValidHttpsOrRelativeUrl(rawBranding.logo_url)) {
    sanitized.logo_url = rawBranding.logo_url.trim();
  }

  if (isValidHttpsOrRelativeUrl(rawBranding.favicon_url)) {
    sanitized.favicon_url = rawBranding.favicon_url.trim();
  }

  if (isValidFontFamily(rawBranding.font_family)) {
    sanitized.font_family = rawBranding.font_family.trim();
  }

  if (typeof rawBranding.theme_preset === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(rawBranding.theme_preset.trim())) {
    sanitized.theme_preset = rawBranding.theme_preset.trim();
  }

  if (
    typeof rawBranding.support_email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawBranding.support_email.trim())
  ) {
    sanitized.support_email = rawBranding.support_email.trim();
  }

  return sanitized;
}
