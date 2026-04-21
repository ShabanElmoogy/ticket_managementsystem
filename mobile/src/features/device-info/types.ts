export interface InfoRow {
  label: string;
  value: string | number | boolean | null | undefined;
}

export interface InfoSection {
  title: string;
  emoji: string;
  color: string;
  rows: InfoRow[];
}
