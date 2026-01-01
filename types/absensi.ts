export interface AbsensiDetailParams {
  status: string;
  keterangan: string;
  date: string;
  time: string;
  notes?: string;
  area: string;
  division: string;
}

export type AbsensiType = 'check_in' | 'check_out';

export interface KeteranganTheme {
  color: string;
  background: string;
  textColor: string;
}