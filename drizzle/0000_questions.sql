CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('official','network')),
  source TEXT NOT NULL,
  en TEXT NOT NULL,
  zh TEXT NOT NULL,
  options_json TEXT NOT NULL CHECK(json_valid(options_json)),
  answer_index INTEGER NOT NULL CHECK(answer_index >= 0 AND answer_index < json_array_length(options_json)),
  notes_json TEXT NOT NULL CHECK(json_valid(notes_json))
);
