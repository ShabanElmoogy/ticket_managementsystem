/** Shared option type used by ChipRows, ChipTiles, and ChipSelector */
export interface ChipOption<T extends string = string> {
  value:        T;
  label:        string;
  icon?:        string;
  /** ChipRows only — subtitle below label */
  description?: string;
  /** ChipRows only — monospace badge on the right */
  preview?:     string;
  /** ChipTiles only — accent color when active */
  color?:       string;
}
