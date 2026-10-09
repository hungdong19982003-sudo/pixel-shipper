import { WEEK_CONFIG } from '../config/GameConfig';
import { PlayerStats, StoryProgress } from '../types';

const FIRST_WEEK_STORY = [
  'Buổi sáng đầu tiên, Minh nhìn tấm bằng Công nghệ thông tin trên bàn. Tiền trọ còn sáu ngày nữa đến hạn. Hôm nay hãy thử nhận và giao một đơn trên điện thoại.',
  'Một cuốc xe đã giúp Minh bớt ngại đường phố. Cô Hạnh hỏi thăm qua cửa: “Đi làm nhớ ăn sáng đấy.” Hãy tìm một quán quen trên đường giao hàng.',
  'Thành phố bắt đầu có những gương mặt quen. Minh nhận ra một lời chào ở quầy hàng cũng có thể làm ngày dài nhẹ hơn.',
  'Ngày thứ tư, chiếc xe và cái bụng đều cần được chăm sóc. Minh cân nhắc tiền xăng, bữa ăn và khoản trọ sắp tới.',
  'Sau một ngày chạy xe, bến câu cuối ngõ là chỗ Minh có thể nghỉ tay. Cá câu được có thể nấu ăn, bán hoặc đem tặng.',
  'Mai cô Hạnh đến thu tiền. Minh kiểm lại ví và chọn những cuốc xe phù hợp với sức mình. Mọi khoản kiếm thêm đều giúp ích.',
  'Ngày hẹn tiền trọ đã đến. Minh trở về phòng, nhớ lại tuần đầu tiên trên những con phố này. Cô Hạnh đang chờ ở cửa.'
];

export class WeekManager {
  public static progress(stats: PlayerStats): StoryProgress {
    return stats.storyProgress ??= {
      introSeen: true,
      landladyVisitCount: 0,
      lastLandladyVisitDay: -2,
      lastRentDay: 0,
      rentDebt: 0,
      lastStoryDay: 0,
      dayStartOrders: stats.completedOrders,
      lastRewardedDay: 0,
      firstWeekCompleted: false
    };
  }

  public static storyForDay(day: number): string | null {
    return FIRST_WEEK_STORY[day - 1] ?? null;
  }

  public static deliveriesToday(stats: PlayerStats): number {
    return Math.max(0, stats.completedOrders - this.progress(stats).dayStartOrders);
  }

  public static finishDay(stats: PlayerStats): number {
    const progress = this.progress(stats);
    const day = stats.day;
    if (day > WEEK_CONFIG.rentPeriodDays || progress.lastRewardedDay >= day ||
      this.deliveriesToday(stats) < WEEK_CONFIG.dailyDeliveryGoal) return 0;
    progress.lastRewardedDay = day;
    stats.wallet += WEEK_CONFIG.dailyGoalBonus;
    return WEEK_CONFIG.dailyGoalBonus;
  }

  public static beginDay(stats: PlayerStats): void {
    this.progress(stats).dayStartOrders = stats.completedOrders;
  }

  public static chargeDueRent(stats: PlayerStats): number {
    const progress = this.progress(stats);
    const billedPeriods = Math.floor(progress.lastRentDay / WEEK_CONFIG.rentPeriodDays);
    const duePeriods = Math.floor(stats.day / WEEK_CONFIG.rentPeriodDays);
    const newPeriods = Math.max(0, duePeriods - billedPeriods);
    if (newPeriods > 0) {
      progress.rentDebt += newPeriods * WEEK_CONFIG.rentAmount;
      progress.lastRentDay = duePeriods * WEEK_CONFIG.rentPeriodDays;
    }
    return progress.rentDebt;
  }

  public static payRent(stats: PlayerStats): boolean {
    const progress = this.progress(stats);
    if (progress.rentDebt <= 0 || stats.wallet < progress.rentDebt) return false;
    stats.wallet -= progress.rentDebt;
    progress.rentDebt = 0;
    if (stats.day >= WEEK_CONFIG.rentPeriodDays) progress.firstWeekCompleted = true;
    return true;
  }
}
