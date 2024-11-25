interface SheetLanguageBase {
  name: string;
  code: string;
}

export interface SheetLanguageData extends SheetLanguageBase {
  checked: boolean;
}

export interface SheetLanguage extends SheetLanguageBase {
  id: string;
}
