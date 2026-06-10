import Taro from '@tarojs/taro';
import {
  Baby,
  AllRecord,
  GrowthRecord,
  Reminder,
  FamilyMember,
  DailyStats
} from '@/types';
import { dayjs, formatTime, formatDuration, getRecordTypeLabel, calcBMI } from '.';

interface BuildReportOptions {
  baby: Baby;
  familyMembers: FamilyMember[];
  records: AllRecord[];
  growthRecords: GrowthRecord[];
  reminders: Reminder[];
  startDate: string;
  endDate: string;
  summary: DailyStats & { period?: string };
}

const htmlEscape = (s?: string | number) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildReportHTML = (opt: BuildReportOptions): string => {
  const { baby, familyMembers, records, growthRecords, reminders, startDate, endDate, summary } = opt;
  const totalDays = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);
  const bmi = baby.weight && baby.height ? calcBMI(baby.weight, baby.height).toFixed(1) : '-';
  const ageDay = dayjs().diff(baby.birthday, 'day');
  const ageMonth = (ageDay / 30).toFixed(1);
  const avgSleep = totalDays ? Math.round((summary.sleepTotalDuration || 0) / totalDays) : 0;
  const avgFeeding = totalDays ? ((summary.feedingTotalAmount || 0) / totalDays).toFixed(0) : 0;

  const recordsByDate = new Map<string, AllRecord[]>();
  records.forEach((r) => {
    const d = dayjs(r.time).format('YYYY-MM-DD');
    if (!recordsByDate.has(d)) recordsByDate.set(d, []);
    recordsByDate.get(d)!.push(r);
  });

  const sortedDates = Array.from(recordsByDate.keys()).sort();
  const memberName = (id?: string) => familyMembers.find((m) => m.id === id)?.name || '本人';

  const colorBadge = (color: string) => {
    const map: Record<string, string> = { yellow: '金黄', green: '绿', brown: '棕', black: '黑', red: '红', other: '其他' };
    return map[color] || color;
  };
  const textureBadge = (t: string) => {
    const map: Record<string, string> = { normal: '正常', loose: '稀', hard: '干', watery: '水样', mucus: '黏液', other: '其他' };
    return map[t] || t;
  };
  const allergyBadge = (a?: string) => {
    const map: Record<string, string> = { none: '无', rash: '皮疹', vomit: '呕吐', diarrhea: '腹泻', other: '其他' };
    return a ? (map[a] || a) : '-';
  };
  const qualityBadge = (q: string) => ({ good: '好', normal: '中', poor: '差' }[q] || q);

  const feedingList = records.filter((r) => ['breast', 'formula', 'bottle'].includes(r.type));
  const diaperList = records.filter((r) => r.type === 'diaper');
  const sleepList = records.filter((r) => r.type === 'sleep');
  const foodList = records.filter((r) => r.type === 'food');
  const upcomingReminders = reminders.filter((r) => !r.completed).slice(0, 20);

  const abnormalRecords = records.filter((r: any) => {
    if (r.note && r.note.trim().length > 0) return true;
    if (r.type === 'diaper') return r.color === 'red' || r.color === 'black' || r.texture === 'watery' || r.texture === 'mucus';
    return false;
  });
  const allergyRecords = records.filter((r: any) => r.type === 'food' && r.allergyReaction && r.allergyReaction !== 'none');
  const vaccinePlan = reminders.filter((r) => r.type === 'vaccine');
  const checkupPlan = reminders.filter((r) => r.type === 'checkup');
  const photoRecords = records.filter((r: any) => r.photos?.length);
  const totalPhotos = photoRecords.reduce((sum: number, r: any) => sum + r.photos!.length, 0);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htmlEscape(baby.name)} 宝宝喂养记录报告</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: linear-gradient(180deg, #FFF0F3 0%, #FFFBF7 400px);
    color: #333;
    font-size: 14px;
    padding: 24px;
    line-height: 1.6;
  }
  .container { max-width: 860px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 36px; box-shadow: 0 10px 40px rgba(255,139,167,0.12); }
  .header { border-bottom: 2px solid #FFE0E8; padding-bottom: 20px; margin-bottom: 28px; }
  .baby-title { font-size: 26px; font-weight: 700; color: #FF5A7E; display: flex; align-items: center; gap: 12px; }
  .baby-title .baby-emoji { font-size: 32px; }
  .baby-sub { margin-top: 10px; color: #666; font-size: 13px; display: flex; flex-wrap: wrap; gap: 18px; }
  .baby-sub span b { color: #FF5A7E; font-weight: 600; }
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 17px; font-weight: 700; color: #FF5A7E; margin-bottom: 16px;
    padding-left: 14px; border-left: 4px solid #FF8BA7; display: flex; align-items: center; gap: 10px;
  }
  .section-title .emoji { font-size: 20px; }
  .summary-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 18px;
  }
  .sum-card { background: linear-gradient(135deg, #FFF0F3 0%, #FFFAF3 100%); padding: 16px; border-radius: 12px; }
  .sum-label { font-size: 12px; color: #999; margin-bottom: 6px; }
  .sum-value { font-size: 22px; font-weight: 700; color: #FF5A7E; }
  .sum-unit { font-size: 12px; color: #999; margin-left: 4px; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff; }
  thead th {
    background: #FFF0F3; color: #FF5A7E; padding: 10px 12px; text-align: left; font-weight: 600;
    border-bottom: 2px solid #FFE0E8; white-space: nowrap;
  }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #F5F0F2; color: #444; }
  tbody tr:hover { background: #FFFAFB; }
  .date-group-title { background: #FFFAF3; color: #C24A6B; padding: 8px 12px; border-radius: 6px; margin: 16px 0 8px; font-size: 13px; font-weight: 600; }
  .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #F0E8EB; color: #999; font-size: 12px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; background: #FFF0F3; color: #FF5A7E; margin-right: 4px; }
  .tag-n { background: #EEF7FF; color: #2A7DC9; }
  .tag-s { background: #F2F2FF; color: #6667C9; }
  .tag-g { background: #F0F7EF; color: #4D8A43; }
  .tag-w { background: #FFF7EF; color: #C9762A; }
  .note { color: #999; font-size: 12px; }
  .reminder-up { color: #C24A6B; font-weight: 600; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="baby-title"><span class="baby-emoji">👶</span>${htmlEscape(baby.name)} · 喂养与作息报告</div>
    <div class="baby-sub">
      <span>性别：<b>${baby.gender === 'boy' ? '男宝' : '女宝'}</b></span>
      <span>出生日期：<b>${htmlEscape(baby.birthday)}</b></span>
      <span>月龄：<b>${ageMonth}个月</b></span>
      <span>当前身高：<b>${baby.height || '-'}cm</b></span>
      <span>体重：<b>${baby.weight || '-'}kg</b></span>
      <span>BMI：<b>${bmi}</b></span>
      <span>头围：<b>${baby.headCircumference || '-'}cm</b></span>
    </div>
    <div class="baby-sub" style="margin-top:12px">
      <span>统计周期：<b>${htmlEscape(startDate)} 至 ${htmlEscape(endDate)}</b>（共 ${totalDays} 天）</span>
      <span>生成时间：<b>${dayjs().format('YYYY-MM-DD HH:mm')}</b></span>
      <span>记录人数：<b>${familyMembers.length}人</b></span>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="emoji">📊</span>周期汇总</div>
    <div class="summary-grid">
      <div class="sum-card"><div class="sum-label">喂奶次数</div><div class="sum-value">${summary.feedingCount}<span class="sum-unit">次</span></div></div>
      <div class="sum-card"><div class="sum-label">配方奶/瓶喂总量</div><div class="sum-value">${summary.feedingTotalAmount}<span class="sum-unit">ml</span></div></div>
      <div class="sum-card"><div class="sum-label">日均奶量</div><div class="sum-value">${avgFeeding}<span class="sum-unit">ml/天</span></div></div>
      <div class="sum-card"><div class="sum-label">亲喂总时长</div><div class="sum-value">${Math.floor((summary.breastTotalDuration||0)/60)}<span class="sum-unit">小时</span>${(summary.breastTotalDuration||0)%60}<span class="sum-unit">分</span></div></div>
      <div class="sum-card"><div class="sum-label">尿布次数</div><div class="sum-value">${summary.diaperCount}<span class="sum-unit">次</span></div></div>
      <div class="sum-card"><div class="sum-label">睡眠总时长</div><div class="sum-value">${Math.floor((summary.sleepTotalDuration||0)/60)}<span class="sum-unit">小时</span>${(summary.sleepTotalDuration||0)%60}<span class="sum-unit">分</span></div></div>
      <div class="sum-card"><div class="sum-label">日均睡眠</div><div class="sum-value">${Math.floor(avgSleep/60)}<span class="sum-unit">小时</span>${avgSleep%60}<span class="sum-unit">分</span></div></div>
      <div class="sum-card"><div class="sum-label">睡眠次数</div><div class="sum-value">${summary.sleepCount}<span class="sum-unit">次</span></div></div>
      <div class="sum-card"><div class="sum-label">辅食次数</div><div class="sum-value">${summary.foodCount}<span class="sum-unit">次</span></div></div>
    </div>
  </div>

  ${feedingList.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">🍼</span>喂奶记录（${feedingList.length}条）</div>
    <table><thead><tr>
      <th>时间</th><th>类型</th><th>详情</th><th>操作人</th><th>备注</th>
    </tr></thead><tbody>
      ${feedingList.map((r: any) => {
        const detail = r.type === 'breast'
          ? `左侧 ${r.leftDuration||0}分 / 右侧 ${r.rightDuration||0}分 / 合计 ${r.totalDuration||0}分`
          : r.type === 'formula'
            ? `水${r.waterAmount}ml + ${r.powderAmount}勺${r.brand?'('+r.brand+')':''}${r.waterTemp?', 水温'+r.waterTemp+'℃':''}`
            : `奶量${r.amount}ml${r.duration?', 用时'+r.duration+'分':''}${r.milkType?' ('+({breast:'母乳',formula:'配方',mixed:'混合'} as any)[r.milkType]+')':''}`;
        return `<tr>
          <td>${formatTime(r.time)}</td>
          <td><span class="tag">${getRecordTypeLabel(r.type)}</span></td>
          <td>${htmlEscape(detail)}</td>
          <td>${htmlEscape(memberName(r.createdBy))}</td>
          <td class="note">${htmlEscape(r.note)}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>` : ''}

  ${foodList.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">🥣</span>辅食记录（${foodList.length}条）</div>
    <table><thead><tr>
      <th>时间</th><th>辅食</th><th>食材</th><th>份量</th><th>过敏</th><th>操作人</th><th>备注</th>
    </tr></thead><tbody>
      ${foodList.map((r: any) => `<tr>
        <td>${formatTime(r.time)}</td>
        <td><b>${htmlEscape(r.foodName)}</b></td>
        <td>${(r.ingredients||[]).map((i:string)=>`<span class="tag tag-n">${htmlEscape(i)}</span>`).join('')}</td>
        <td>${r.amount}${r.unit}</td>
        <td><span class="tag ${r.allergyReaction==='none'?'tag-g':'tag-w'}">${allergyBadge(r.allergyReaction)}</span></td>
        <td>${htmlEscape(memberName(r.createdBy))}</td>
        <td class="note">${htmlEscape(r.note || r.reactionDetail)}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  ${diaperList.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">🧷</span>尿布记录（${diaperList.length}条）</div>
    <table><thead><tr>
      <th>时间</th><th>类型</th><th>颜色</th><th>形态</th><th>用量</th><th>操作人</th><th>备注</th>
    </tr></thead><tbody>
      ${diaperList.map((r: any) => {
        const t = {pee:'小便', poop:'大便', both:'大小便'}[r.diaperType] || r.diaperType;
        const a = {little:'少', medium:'中', large:'多'}[r.amount||'medium'] || '-';
        return `<tr>
          <td>${formatTime(r.time)}</td>
          <td><span class="tag tag-g">${t}</span></td>
          <td><span class="tag tag-n">${colorBadge(r.color)}</span></td>
          <td>${textureBadge(r.texture)}</td>
          <td>${a}</td>
          <td>${htmlEscape(memberName(r.createdBy))}</td>
          <td class="note">${htmlEscape(r.note)}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>` : ''}

  ${sleepList.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">😴</span>睡眠记录（${sleepList.length}条）</div>
    <table><thead><tr>
      <th>日期</th><th>起止</th><th>时长</th><th>质量</th><th>环境</th><th>操作人</th><th>备注</th>
    </tr></thead><tbody>
      ${sleepList.map((r: any) => `<tr>
        <td>${dayjs(r.startTime).format('YYYY-MM-DD')}</td>
        <td>${formatTime(r.startTime)} - ${r.endTime?formatTime(r.endTime):'进行中'}</td>
        <td><b style="color:#6667C9">${formatDuration(r.duration||0)}</b></td>
        <td><span class="tag tag-s">${qualityBadge(r.quality)}</span></td>
        <td>${htmlEscape(r.environment||'-')}</td>
        <td>${htmlEscape(memberName(r.createdBy))}</td>
        <td class="note">${htmlEscape(r.note)}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  ${growthRecords.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">📈</span>成长数据（${growthRecords.length}次测量）</div>
    <table><thead><tr>
      <th>测量日期</th><th>身高(cm)</th><th>体重(kg)</th><th>头围(cm)</th><th>BMI</th><th>备注</th>
    </tr></thead><tbody>
      ${[...growthRecords].sort((a,b)=>dayjs(a.date).valueOf()-dayjs(b.date).valueOf()).map((r) => {
        const b = r.weight && r.height ? calcBMI(r.weight, r.height).toFixed(1) : '-';
        return `<tr>
          <td><b>${r.date}</b></td>
          <td>${r.height ?? '-'}</td>
          <td>${r.weight ?? '-'}</td>
          <td>${r.headCircumference ?? '-'}</td>
          <td><span class="tag tag-n">${b}</span></td>
          <td class="note">${htmlEscape(r.note)}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>` : ''}

  ${upcomingReminders.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">⏰</span>待办提醒（${upcomingReminders.length}项）</div>
    <table><thead><tr>
      <th>类型</th><th>内容</th><th>时间</th><th>重复</th><th>备注</th>
    </tr></thead><tbody>
      ${upcomingReminders.map((r) => {
        const typeMap: Record<string, string> = { vaccine: '💉疫苗', checkup: '🏥体检', feeding: '🍼喂奶', custom: '📝自定义' };
        const repMap: Record<string, string> = { none: '不重复', daily: '每天', weekly: '每周', monthly: '每月' };
        return `<tr>
          <td><span class="tag tag-w">${typeMap[r.type]||r.type}</span></td>
          <td class="reminder-up">${htmlEscape(r.title)}</td>
          <td>${htmlEscape(r.time)}</td>
          <td>${repMap[r.repeat]||r.repeat}</td>
          <td class="note">${htmlEscape(r.note)}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>` : ''}

  ${records.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">📅</span>按日期时间轴</div>
    ${sortedDates.map((d) => `<div class="date-group-title">${d}（${recordsByDate.get(d)!.length}条记录）</div>
      <table><thead><tr><th style="width:80px">时间</th><th>类型</th><th>详情摘要</th><th style="width:80px">操作人</th></tr></thead><tbody>
      ${recordsByDate.get(d)!.map((r: any) => {
        let summary = '-';
        if (r.type === 'breast') summary = `左${r.leftDuration||0}分/右${r.rightDuration||0}分/共${r.totalDuration||0}分`;
        else if (r.type === 'formula') summary = `${r.waterAmount}ml水+${r.powderAmount}勺${r.brand?'('+r.brand+')':''}`;
        else if (r.type === 'bottle') summary = `${r.amount}ml${r.duration?', '+r.duration+'分':''}`;
        else if (r.type === 'food') summary = `${r.foodName} ${r.amount}${r.unit}${r.allergyReaction&&r.allergyReaction!=='none'?' · 过敏:'+allergyBadge(r.allergyReaction):''}`;
        else if (r.type === 'diaper') summary = `${({pee:'小便',poop:'大便',both:'大小便'} as any)[r.diaperType]} · ${colorBadge(r.color)} · ${textureBadge(r.texture)}`;
        else if (r.type === 'sleep') summary = `${formatDuration(r.duration||0)} · 质量：${qualityBadge(r.quality)}${r.environment?' · '+r.environment:''}`;
        return `<tr>
          <td>${dayjs(r.time).format('HH:mm')}</td>
          <td><span class="tag">${getRecordTypeLabel(r.type)}</span></td>
          <td>${htmlEscape(summary)}</td>
          <td>${htmlEscape(memberName(r.createdBy))}</td>
        </tr>`;
      }).join('')}
      </tbody></table>`).join('')}
  </div>` : ''}

  ${abnormalRecords.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">🚨</span>异常记录与医生关注点（${abnormalRecords.length}条）</div>
    <table><thead><tr>
      <th>日期时间</th><th>类型</th><th>异常原因</th><th>详情</th><th>操作人</th>
    </tr></thead><tbody>
      ${abnormalRecords.map((r: any) => {
        const reasons: string[] = [];
        if (r.type === 'diaper') {
          if (r.color === 'red' || r.color === 'black') reasons.push(`异常便色：${colorBadge(r.color)}色`);
          if (r.texture === 'watery' || r.texture === 'mucus') reasons.push(`异常形态：${textureBadge(r.texture)}`);
        }
        if (r.note?.trim()) reasons.push('有备注说明');
        let detail = '-';
        if (r.type === 'diaper') {
          detail = `${({pee:'小便',poop:'大便',both:'大小便'} as any)[r.diaperType]} · ${colorBadge(r.color)} · ${textureBadge(r.texture)}`;
        } else if (r.type === 'breast') {
          detail = `左${r.leftDuration||0}分/右${r.rightDuration||0}分/共${r.totalDuration||0}分`;
        } else if (r.type === 'formula') {
          detail = `${r.waterAmount}ml水+${r.powderAmount}勺`;
        } else if (r.type === 'bottle') {
          detail = `${r.amount}ml`;
        } else if (r.type === 'food') {
          detail = `${r.foodName} ${r.amount}${r.unit}`;
        } else if (r.type === 'sleep') {
          detail = `${formatDuration(r.duration||0)} · 质量：${qualityBadge(r.quality)}`;
        }
        return `<tr>
          <td>${dayjs(r.time).format('YYYY-MM-DD HH:mm')}</td>
          <td><span class="tag">${getRecordTypeLabel(r.type)}</span></td>
          <td style="color:#FF4D4F;font-weight:600">${reasons.join('；')}</td>
          <td>${htmlEscape(detail)}${r.note?.trim() ? `<div class="note" style="margin-top:4px">📝 ${htmlEscape(r.note)}</div>` : ''}</td>
          <td>${htmlEscape(memberName(r.createdBy))}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>` : ''}

  ${allergyRecords.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">🥣</span>辅食过敏反应汇总（${allergyRecords.length}次）</div>
    <table><thead><tr>
      <th>日期</th><th>辅食名称</th><th>食材</th><th>过敏反应</th><th>反应详情</th><th>操作人</th>
    </tr></thead><tbody>
      ${allergyRecords.map((r: any) => `<tr>
        <td>${dayjs(r.time).format('YYYY-MM-DD HH:mm')}</td>
        <td><b>${htmlEscape(r.foodName)}</b></td>
        <td>${(r.ingredients||[]).map((i:string)=>`<span class="tag tag-n">${htmlEscape(i)}</span>`).join('')}</td>
        <td><span class="tag tag-w">${allergyBadge(r.allergyReaction)}</span></td>
        <td class="note" style="color:#C9762A">${htmlEscape(r.reactionDetail || r.note || '-')}</td>
        <td>${htmlEscape(memberName(r.createdBy))}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  ${vaccinePlan.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">💉</span>疫苗计划（${vaccinePlan.length}项）</div>
    <table><thead><tr>
      <th>状态</th><th>疫苗名称</th><th>预约时间</th><th>备注</th>
    </tr></thead><tbody>
      ${vaccinePlan.map((r) => `<tr>
        <td>${r.completed ? '<span class="tag tag-g">已完成</span>' : '<span class="tag tag-w">待接种</span>'}</td>
        <td class="reminder-up">${htmlEscape(r.title)}</td>
        <td>${htmlEscape(r.time || '-')}</td>
        <td class="note">${htmlEscape(r.note)}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  ${checkupPlan.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">🏥</span>体检安排（${checkupPlan.length}项）</div>
    <table><thead><tr>
      <th>状态</th><th>体检项目</th><th>预约时间</th><th>备注</th>
    </tr></thead><tbody>
      ${checkupPlan.map((r) => `<tr>
        <td>${r.completed ? '<span class="tag tag-g">已完成</span>' : '<span class="tag tag-w">待体检</span>'}</td>
        <td class="reminder-up">${htmlEscape(r.title)}</td>
        <td>${htmlEscape(r.time || '-')}</td>
        <td class="note">${htmlEscape(r.note)}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  ${photoRecords.length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="emoji">📷</span>照片附件摘要（共${totalPhotos}张，${photoRecords.length}条记录）</div>
    <table><thead><tr>
      <th>日期时间</th><th>记录类型</th><th>照片数</th><th>操作人</th><th>备注</th>
    </tr></thead><tbody>
      ${photoRecords.map((r: any) => `<tr>
        <td>${dayjs(r.time).format('YYYY-MM-DD HH:mm')}</td>
        <td><span class="tag">${getRecordTypeLabel(r.type)}</span></td>
        <td><b style="color:#2A7DC9">${r.photos!.length}张</b></td>
        <td>${htmlEscape(memberName(r.createdBy))}</td>
        <td class="note">${htmlEscape(r.note || '-')}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  <div class="footer">
    <span>👨‍👩‍👧 家庭成员：${familyMembers.map((m)=>`${m.name}(${m.roleName}${m.canEdit?'·可编辑':'·只读'})`).join('、')}</span>
    <span>本报告由宝宝喂养记录App自动生成 · 医生可据此参考宝宝日常情况</span>
  </div>
</div>
</body>
</html>`;
};

export interface ExportRange {
  startDate: string;
  endDate: string;
  title: string;
}

export const getDateRange = (type: 'week' | 'month' | 'custom', date?: string, customStart?: string, customEnd?: string): ExportRange => {
  const t = date ? dayjs(date) : dayjs();
  if (type === 'week') {
    const s = t.startOf('week').format('YYYY-MM-DD');
    const e = t.endOf('week').format('YYYY-MM-DD');
    return { startDate: s, endDate: e, title: `${s} 至 ${e}（本周）` };
  }
  if (type === 'month') {
    const s = t.startOf('month').format('YYYY-MM-DD');
    const e = t.endOf('month').format('YYYY-MM-DD');
    return { startDate: s, endDate: e, title: `${t.format('YYYY年M月')}（本月）` };
  }
  if (customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd, title: `${customStart} 至 ${customEnd}` };
  }
  const s = t.format('YYYY-MM-DD');
  return { startDate: s, endDate: s, title: `${s}（今日）` };
};

export const exportBabyReport = (opt: BuildReportOptions): { html: string; fileName: string } => {
  const html = buildReportHTML(opt);
  const fileName = `${opt.baby.name}_喂养报告_${dayjs().format('YYYYMMDDHHmm')}.html`;
  return { html, fileName };
};

const downloadH5 = (html: string, fileName: string) => {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) {
    console.warn('HTML下载失败', e);
    return false;
  }
};

export const downloadReport = (opt: BuildReportOptions): boolean => {
  const { html, fileName } = exportBabyReport(opt);
  if (typeof window !== 'undefined') {
    return downloadH5(html, fileName);
  }
  try {
    Taro.setClipboardData({ data: `报告已生成：${fileName}` });
    Taro.showModal({
      title: '报告已生成',
      content: fileName + '\n（小程序端可通过"分享给医生"转发）',
      showCancel: false
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const shareReport = (opt: BuildReportOptions) => {
  const { html, fileName } = exportBabyReport(opt);
  const summary = `${opt.baby.name}·${opt.startDate}~${opt.endDate}喂养报告|奶量${opt.summary.feedingTotalAmount}ml|睡眠${Math.floor((opt.summary.sleepTotalDuration||0)/60)}h|尿布${opt.summary.diaperCount}次`;
  if (typeof window !== 'undefined') {
    const ok = downloadH5(html, fileName);
    if (ok) {
      Taro.showToast({ title: '报告已下载', icon: 'success' });
      return;
    }
  }
  try {
    if ((navigator as any)?.share) {
      const blob = new Blob([html], { type: 'text/html' });
      const f = new File([blob], fileName, { type: 'text/html' });
      (navigator as any).share({ title: fileName, text: summary, files: [f] }).catch(() => {
        Taro.setClipboardData({ data: summary });
      });
      return;
    }
  } catch (e) { /* ignore */ }
  Taro.setClipboardData({ data: summary });
  Taro.showToast({ title: '摘要已复制', icon: 'success' });
};

export interface ReportRange { startDate: string; endDate: string; title: string; }
export const showDoctorReportPicker = (
  opts: {
    baby: Baby;
    allRecords: AllRecord[];
    growthRecords: GrowthRecord[];
    reminders: Reminder[];
    familyMembers: FamilyMember[];
    getPeriodSummary: any;
    getRecordsByDateRange: any;
    mode?: 'download' | 'share';
  }
): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const rangeRes = await Taro.showActionSheet({
      itemList: ['📅 本周数据', '📅 本月数据', '📅 近7天', '📅 近30天', '📅 自定义区间（默认本月）']
    }).catch(() => null);
    if (!rangeRes || rangeRes.tapIndex === undefined) { resolve(false); return; }
    let range: ReportRange;
    const today = dayjs();
    switch (rangeRes.tapIndex) {
      case 0: range = { startDate: today.startOf('week').format('YYYY-MM-DD'), endDate: today.endOf('week').format('YYYY-MM-DD'), title: '本周' }; break;
      case 1: range = { startDate: today.startOf('month').format('YYYY-MM-DD'), endDate: today.endOf('month').format('YYYY-MM-DD'), title: '本月' }; break;
      case 2: range = { startDate: today.subtract(6, 'day').format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD'), title: '近7天' }; break;
      case 3: range = { startDate: today.subtract(29, 'day').format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD'), title: '近30天' }; break;
      default: range = { startDate: today.startOf('month').format('YYYY-MM-DD'), endDate: today.endOf('month').format('YYYY-MM-DD'), title: '自定义' };
    }
    let modeFinal = opts.mode;
    if (!modeFinal) {
      const modeRes = await Taro.showActionSheet({
        itemList: ['📄 下载HTML报告（可打印给医生）', '📤 分享（复制摘要+下载）']
      }).catch(() => null);
      if (!modeRes || modeRes.tapIndex === undefined) { resolve(false); return; }
      modeFinal = modeRes.tapIndex === 0 ? 'download' : 'share';
    }
    const summary = opts.getPeriodSummary('day', range.endDate);
    const inRange = opts.getRecordsByDateRange(range.startDate, range.endDate);
    const dayCount = Math.max(1, dayjs(range.endDate).diff(dayjs(range.startDate), 'day') + 1);
    let feedingCount = 0, feedingTotalAmount = 0, breastTotalDuration = 0;
    let foodCount = 0, diaperCount = 0, sleepTotalDuration = 0, sleepCount = 0;
    inRange.forEach((r: any) => {
      if (r.type === 'breast') { feedingCount++; breastTotalDuration += r.totalDuration||0; }
      else if (r.type === 'formula') { feedingCount++; feedingTotalAmount += r.waterAmount||0; }
      else if (r.type === 'bottle') { feedingCount++; feedingTotalAmount += r.amount||0; }
      else if (r.type === 'food') foodCount++;
      else if (r.type === 'diaper') diaperCount++;
      else if (r.type === 'sleep') { sleepCount++; sleepTotalDuration += r.duration||0; }
    });
    const periodSummary = {
      date: range.endDate, period: 'month' as any, startDate: range.startDate, endDate: range.endDate, dayCount,
      feedingCount, feedingTotalAmount, breastTotalDuration, foodCount, diaperCount, sleepTotalDuration, sleepCount
    };
    const params = {
      baby: opts.baby,
      familyMembers: opts.familyMembers,
      records: inRange,
      growthRecords: opts.growthRecords,
      reminders: opts.reminders,
      startDate: range.startDate,
      endDate: range.endDate,
      summary: periodSummary
    };
    const ok = modeFinal === 'download' ? downloadReport(params) : shareReport(params);
    resolve(!!ok);
  });
};
