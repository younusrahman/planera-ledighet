import dayjs from "dayjs";

export interface Holiday {
  date: string;
  name: string;
  isRedDay: boolean;
}

export const getSwedishHolidays = (year: number): Record<string, Holiday> => {
  const holidays: Record<string, Holiday> = {};

  const add = (date: dayjs.Dayjs, name: string, isRedDay = true) => {
    holidays[date.format("YYYY-MM-DD")] = {
      date: date.format("YYYY-MM-DD"),
      name,
      isRedDay,
    };
  };

  // Fasta helgdagar
  add(dayjs(`${year}-01-01`), "Nyårsdagen");
  add(dayjs(`${year}-01-06`), "Trettondedag jul");
  add(dayjs(`${year}-05-01`), "Första maj");
  add(dayjs(`${year}-06-06`), "Nationaldagen");
  add(dayjs(`${year}-12-25`), "Juldagen");
  add(dayjs(`${year}-12-26`), "Annandag jul");

  // Rörliga aftnar (behandlas ofta som röda dagar i Sverige)
  // Midsommarafton: Fredagen mellan 19-25 juni
  let midsommarAfton = dayjs(`${year}-06-19`);
  while (midsommarAfton.day() !== 5)
    midsommarAfton = midsommarAfton.add(1, "day");
  add(midsommarAfton, "Midsommarafton", true);
  add(midsommarAfton.add(1, "day"), "Midsommardagen");

  add(dayjs(`${year}-12-24`), "Julafton", true);
  add(dayjs(`${year}-12-31`), "Nyårsafton", true);

  // Påsk (rörlig) - Gauss algoritm för påskdagen
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;

  const pasch = dayjs(new Date(year, month - 1, day));
  add(pasch.subtract(2, "day"), "Långfredagen");
  add(pasch.subtract(1, "day"), "Påskafton", false);
  add(pasch, "Påskdagen");
  add(pasch.add(1, "day"), "Annandag påsk");
  add(pasch.add(39, "day"), "Kristi himmelsfärdsdag");
  add(pasch.add(49, "day"), "Pingstdagen");

  // Alla helgons dag (Lördagen mellan 31 okt och 6 nov)
  let allaHelgon = dayjs(`${year}-10-31`);
  while (allaHelgon.day() !== 6) allaHelgon = allaHelgon.add(1, "day");
  add(allaHelgon, "Alla helgons dag");

  return holidays;
};
