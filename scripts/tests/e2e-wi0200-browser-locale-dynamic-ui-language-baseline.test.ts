import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const { normalizeLocale, resolveLocaleFromAcceptLanguage } = await import(
    "../../src/lib/i18n/locales.ts"
  );
  const { translate } = await import("../../src/lib/i18n/messages.ts");

  assert.equal(normalizeLocale("ko-KR"), "ko", "normalizeLocale should map ko-KR to ko");
  assert.equal(normalizeLocale("en_US"), "en", "normalizeLocale should map en_US to en");
  assert.equal(normalizeLocale("fr-FR"), null, "normalizeLocale should return null for unsupported locale");

  assert.equal(
    resolveLocaleFromAcceptLanguage("en-US,en;q=0.9,ko;q=0.8"),
    "en",
    "accept-language should prioritize top weighted supported locale"
  );
  assert.equal(
    resolveLocaleFromAcceptLanguage("fr-FR,ko;q=0.9"),
    "ko",
    "accept-language should fallback to first supported locale in weighted order"
  );
  assert.equal(
    resolveLocaleFromAcceptLanguage(null),
    "ko",
    "accept-language fallback should default to ko"
  );

  assert.equal(translate("ko", "home.cta.login"), "로그인", "Korean translation should be available");
  assert.equal(translate("en", "home.cta.login"), "Log In", "English translation should be available");

  const rootLayoutSource = readUtf8("src", "app", "layout.tsx");
  const homePageSource = readUtf8("src", "app", "page.tsx");
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const employeeLayoutSource = readUtf8("src", "app", "employee", "layout.tsx");
  const loginPageSource = readUtf8("src", "app", "login", "page.tsx");
  const sessionMenuSource = readUtf8("src", "components", "SessionMenu.tsx");

  assert.match(
    rootLayoutSource,
    /getRequestLocale/,
    "root layout should resolve request locale from browser language header"
  );
  assert.match(rootLayoutSource, /<html lang=\{locale\}>/, "root layout should apply dynamic html lang");
  assert.match(
    rootLayoutSource,
    /I18nProvider initialLocale=\{locale\}/,
    "root layout should provide locale context to client components"
  );

  assert.match(homePageSource, /getRequestLocale/, "home page should resolve locale from the request");
  assert.match(homePageSource, /const isKoLocale = locale === "ko"/, "home page should branch on locale");

  assert.match(adminLayoutSource, /createTranslator/, "admin layout should use i18n translator");
  assert.match(
    adminLayoutSource,
    /navAriaLabel=\{isKoLocale \? "관리자 탐색" : "Admin navigation"\}/,
    "admin layout should localize navigation labels"
  );

  assert.match(employeeLayoutSource, /createTranslator/, "employee layout should use i18n translator");
  assert.match(
    employeeLayoutSource,
    /navAriaLabel=\{isKoLocale \? "직원 탐색" : "Employee navigation"\}/,
    "employee layout should localize navigation labels"
  );

  assert.match(loginPageSource, /useI18n/, "login page should consume i18n context");
  assert.match(loginPageSource, /const \{ locale \} = useI18n\(\)/, "login page should read the active locale");
  assert.match(loginPageSource, /isKoLocale \? "로그인" : "Sign in"/, "login page should render localized strings");

  assert.match(sessionMenuSource, /useI18n/, "session menu should consume i18n context");
  assert.match(
    sessionMenuSource,
    /t\("sessionMenu\.signOut"\)/,
    "session menu should render localized action labels"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
