import dayjs from "dayjs";
import "dayjs/locale/sv";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from "dayjs/plugin/updateLocale";
// --- PLUGINS ---
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);

// LOCALE SETTINGS
dayjs.locale("sv");
dayjs.updateLocale("sv", {
  weekStart: 1,
});