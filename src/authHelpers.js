export const ALLOWED_ENTRY_EDITORS = [
  "nicolesanjuan.metadigitrading@gmail.com",
  "reginaldbayalan.metadigitrading@gmail.com",
];
export const isEntryEditor = (user) =>
  ALLOWED_ENTRY_EDITORS.includes((user?.email || "").toLowerCase());
