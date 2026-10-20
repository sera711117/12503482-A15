/*************************************************
 * 여의도동 48-1·48-5 통합개발 사업성 분석
 * Backend : Code.gs
 *************************************************/

// ★ 본인의 구글 스프레드시트 ID로 변경하세요.
const SPREADSHEET_ID = '1ahI5ror5S6hK7PBP1n-w7aV0S1amSoZNo0GOMiCLQGY';

const SCENARIO_SHEET_NAME = '시나리오';


/*************************************************
 * 1. 웹앱 실행
 *************************************************/
function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('여의도 개발사업 적정 토지가격 분석')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/*************************************************
 * 2. 개발사업 사업성 계산
 *************************************************/
function calculateProject(input) {

  // -----------------------------
  // 입력값
  // -----------------------------
  const landArea = Number(input.landArea);                 // 평
  const landPrice = Number(input.landPrice);               // 억원

  const bcr = Number(input.bcr) / 100;                     // 건폐율
  const far = Number(input.far) / 100;                     // 용적률

  const nonFarAreaRatio =
    Number(input.nonFarAreaRatio) / 100;                   // 용적률 제외면적 비율

  const saleAreaRatio =
    Number(input.saleAreaRatio) / 100;                     // 분양면적 비율

  const saleUnitPrice =
    Number(input.saleUnitPrice);                           // 만원/평

  const constructionUnitCost =
    Number(input.constructionUnitCost);                    // 만원/평

  const otherCostRatio =
    Number(input.otherCostRatio) / 100;

  const loanRatio =
    Number(input.loanRatio) / 100;

  const interestRate =
    Number(input.interestRate) / 100;

  const projectMonths =
    Number(input.projectMonths);

  const targetProfitRatio =
    Number(input.targetProfitRatio) / 100;

  const landAcquisitionRatio =
    Number(input.landAcquisitionRatio) / 100;


  // -----------------------------
  // 사업기간 : 년 단위
  // -----------------------------
  const projectYears = projectMonths / 12;


  /*************************************************
   * 3. 개발규모
   *************************************************/

  // 건축면적
  const buildingArea =
    landArea * bcr;

  // 용적률 산정 연면적
  const farArea =
    landArea * far;

  // 용적률 제외면적
  const nonFarArea =
    farArea * nonFarAreaRatio;

  // 공사비 산정 연면적
  const constructionArea =
    farArea * (1 + nonFarAreaRatio);

  // 분양면적
  const saleArea =
    farArea * saleAreaRatio;


  /*************************************************
   * 4. 매출액
   *************************************************/

  // 총 분양수입
  // 만원 → 억원 환산
  const salesRevenue =
    (saleArea * saleUnitPrice) / 10000;


  /*************************************************
   * 5. 공사비 및 기타사업비
   *************************************************/

  // 직접공사비
  const directConstructionCost =
    (constructionArea * constructionUnitCost) / 10000;

  // 기타사업비
  const otherCost =
    directConstructionCost * otherCostRatio;


  /*************************************************
   * 6. 금융비용
   *************************************************/

  // 토지 금융비용
  const landFinanceCost =
    landPrice *
    loanRatio *
    interestRate *
    projectYears;

  // 건설 금융비용
  // 공사비와 기타사업비 평균 50% 집행 가정
  const constructionFinanceCost =
    (directConstructionCost + otherCost) *
    0.5 *
    loanRatio *
    interestRate *
    projectYears;


  /*************************************************
   * 7. 토지취득 부대비용
   *************************************************/

  const landAcquisitionCost =
    landPrice * landAcquisitionRatio;


  /*************************************************
   * 8. 총사업비
   *************************************************/

  const totalProjectCost =
    landPrice +
    landAcquisitionCost +
    directConstructionCost +
    otherCost +
    landFinanceCost +
    constructionFinanceCost;


  /*************************************************
   * 9. 개발이익
   *************************************************/

  const developmentProfit =
    salesRevenue - totalProjectCost;

  const developmentProfitRate =
    salesRevenue !== 0
      ? (developmentProfit / salesRevenue) * 100
      : 0;


  /*************************************************
   * 10. 목표이익
   *************************************************/

  const targetProfit =
    salesRevenue * targetProfitRatio;


  /*************************************************
   * 11. 적정 토지가격
   *
   * 적정토지가격 =
   * [분양수입 - 목표이익 - 공사비
   *  - 기타사업비 - 건설금융비용]
   *
   * /
   *
   * [1 + 토지취득부대비율
   *  + 차입비율 × 이자율 × 사업기간]
   *************************************************/

  const appropriateLandPrice =
    (
      salesRevenue -
      targetProfit -
      directConstructionCost -
      otherCost -
      constructionFinanceCost
    )
    /
    (
      1 +
      landAcquisitionRatio +
      loanRatio * interestRate * projectYears
    );


  /*************************************************
   * 12. 현재 토지가격과 비교
   *************************************************/

  const landPriceGap =
    appropriateLandPrice - landPrice;

  let status = '';

  if (appropriateLandPrice >= landPrice) {
    status = '사업성 검토 가능';
  } else {
    status = '사업조건 재검토';
  }


  /*************************************************
   * 13. 결과 반환
   *************************************************/

  return {

    // 개발규모
    buildingArea: buildingArea,
    farArea: farArea,
    nonFarArea: nonFarArea,
    constructionArea: constructionArea,
    saleArea: saleArea,

    // 매출
    salesRevenue: salesRevenue,

    // 비용
    directConstructionCost: directConstructionCost,
    otherCost: otherCost,
    landAcquisitionCost: landAcquisitionCost,

    // 금융비용
    landFinanceCost: landFinanceCost,
    constructionFinanceCost: constructionFinanceCost,

    // 총사업비
    totalProjectCost: totalProjectCost,

    // 수익성
    developmentProfit: developmentProfit,
    developmentProfitRate: developmentProfitRate,
    targetProfit: targetProfit,

    // 적정 토지가격
    appropriateLandPrice: appropriateLandPrice,
    landPriceGap: landPriceGap,

    // 판정
    status: status
  };
}


/*************************************************
 * 14. 시나리오 저장
 *************************************************/
function saveScenario(input) {

  const ss =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  let sheet =
    ss.getSheetByName(SCENARIO_SHEET_NAME);

  if (!sheet) {
    sheet =
      ss.insertSheet(SCENARIO_SHEET_NAME);
  }


  // 첫 저장이면 제목행 생성
  if (sheet.getLastRow() === 0) {

    sheet.appendRow([
      '저장일시',
      '대지면적(평)',
      '토지가격(억원)',
      '건폐율(%)',
      '용적률(%)',
      '용적률제외면적비율(%)',
      '분양면적비율(%)',
      '평당분양단가(만원)',
      '평당공사비(만원)',
      '기타사업비율(%)',
      '차입비율(%)',
      '이자율(%)',
      '사업기간(개월)',
      '목표이익률(%)',
      '토지취득부대비율(%)',
      '적정토지가격(억원)'
    ]);

  }


  const result =
    calculateProject(input);


  sheet.appendRow([

    new Date(),

    input.landArea,
    input.landPrice,
    input.bcr,
    input.far,
    input.nonFarAreaRatio,
    input.saleAreaRatio,
    input.saleUnitPrice,
    input.constructionUnitCost,
    input.otherCostRatio,
    input.loanRatio,
    input.interestRate,
    input.projectMonths,
    input.targetProfitRatio,
    input.landAcquisitionRatio,

    result.appropriateLandPrice

  ]);


  return '시나리오가 저장되었습니다.';
}


/* ==================================================
   여의도 제출용 Google Sheet 생성
================================================== */

function createYeouidoAnalysisSheet() {

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let sheet = ss.getSheetByName('여의도_사업성분석');

  if (!sheet) {
    sheet = ss.insertSheet('여의도_사업성분석');
  } else {
    sheet.clear();
  }


  // ==========================================
  // 1. 기본 입력값
  // ==========================================

  const landArea = 366;                // 대지면적(평)
  const landPrice = 732;               // 검토 토지가격(억원)

  const bcr = 59.87 / 100;             // 건폐율
  const far = 974.19 / 100;            // 용적률

  const nonFarAreaRatio = 50 / 100;    // 용적률 제외면적 비율
  const saleAreaRatio = 80 / 100;       // 분양면적 비율

  const saleUnitPrice = 8000;           // 평당 분양단가(만원)
  const constructionUnitCost = 1000;    // 평당 공사비(만원)

  const otherCostRatio = 15 / 100;      // 기타사업비율
  const loanRatio = 70 / 100;           // 차입비율
  const interestRate = 6 / 100;         // 연 이자율

  const projectMonths = 36;             // 사업기간
  const projectYears = projectMonths / 12;

  const targetProfitRatio = 15 / 100;   // 목표이익률
  const landAcquisitionRatio = 5 / 100; // 토지취득 부대비율


  // ==========================================
  // 2. 개발규모 계산
  // ==========================================

  const buildingArea =
    landArea * bcr;

  const farArea =
    landArea * far;

  const nonFarArea =
    farArea * nonFarAreaRatio;

  const constructionArea =
    farArea * (1 + nonFarAreaRatio);

  const saleArea =
    farArea * saleAreaRatio;


  // ==========================================
  // 3. 매출 및 사업비 계산
  // ==========================================

  const salesRevenue =
    saleArea * saleUnitPrice / 10000;

  const directConstructionCost =
    constructionArea * constructionUnitCost / 10000;

  const otherCost =
    directConstructionCost * otherCostRatio;

  const constructionFinanceCost =
    (directConstructionCost + otherCost)
    * 0.5
    * loanRatio
    * interestRate
    * projectYears;

  const landFinanceCost =
    landPrice
    * loanRatio
    * interestRate
    * projectYears;

  const landAcquisitionCost =
    landPrice * landAcquisitionRatio;

  const totalProjectCost =
    landPrice
    + landAcquisitionCost
    + directConstructionCost
    + otherCost
    + constructionFinanceCost
    + landFinanceCost;

  const developmentProfit =
    salesRevenue - totalProjectCost;

  const developmentProfitRate =
    salesRevenue !== 0
      ? developmentProfit / salesRevenue
      : 0;


  // ==========================================
  // 4. 적정 토지가격 계산
  // ==========================================

  const targetProfit =
    salesRevenue * targetProfitRatio;

  const appropriateLandPrice =
    (
      salesRevenue
      - targetProfit
      - directConstructionCost
      - otherCost
      - constructionFinanceCost
    )
    /
    (
      1
      + landAcquisitionRatio
      + loanRatio * interestRate * projectYears
    );

  const landPriceGap =
    appropriateLandPrice - landPrice;

  const status =
    appropriateLandPrice >= landPrice
      ? '사업성 검토 가능'
      : '사업조건 재검토';


  // ==========================================
  // 5. 제목
  // ==========================================

  sheet.getRange('A1:D1')
    .merge()
    .setValue('여의도동 48-1·48-5 통합개발 사업성 분석')
    .setFontSize(16)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackground('#173f65')
    .setFontColor('#ffffff');


  // ==========================================
  // 6. 학생 정보
  // ==========================================

  const studentData = [

    ['학번', '12503482', '이름', '정미정'],

    [
      '프로젝트명',
      '여의도동 48-1·48-5 통합개발',
      '사업유형',
      '업무시설'
    ]

  ];

  sheet.getRange(3, 1, 2, 4)
    .setValues(studentData);


  // ==========================================
  // 7. 기본 입력조건
  // ==========================================

  sheet.getRange('A6:D6')
    .merge()
    .setValue('1. 기본 입력조건')
    .setFontWeight('bold')
    .setBackground('#245b87')
    .setFontColor('#ffffff');


  const inputData = [

    ['항목', '입력값', '단위', '비고'],

    ['대지면적', landArea, '평', '개발계획 기준'],

    ['검토 토지가격', landPrice, '억원', '과거 거래가격 참고'],

    ['건폐율', bcr, '%', '개발계획 기준'],

    ['용적률', far, '%', '개발계획 기준'],

    [
      '용적률 제외면적 비율',
      nonFarAreaRatio,
      '%',
      '개략값'
    ],

    [
      '분양면적 비율',
      saleAreaRatio,
      '%',
      '사업성 분석 가정'
    ],

    [
      '평당 분양단가',
      saleUnitPrice,
      '만원/평',
      '사업성 검토 가정'
    ],

    [
      '평당 공사비',
      constructionUnitCost,
      '만원/평',
      '사업성 분석 가정'
    ],

    [
      '기타사업비율',
      otherCostRatio,
      '%',
      '직접공사비 대비'
    ],

    ['차입비율', loanRatio, '%', '가정'],

    ['연 이자율', interestRate, '%', '가정'],

    ['사업기간', projectMonths, '개월', '가정'],

    [
      '목표이익률',
      targetProfitRatio,
      '%',
      '분양수입 대비'
    ],

    [
      '토지취득 부대비율',
      landAcquisitionRatio,
      '%',
      '가정'
    ]

  ];

  sheet.getRange(
    7,
    1,
    inputData.length,
    4
  ).setValues(inputData);


  // ==========================================
  // 8. 개발규모 산정
  // ==========================================

  sheet.getRange('A23:D23')
    .merge()
    .setValue('2. 개발규모 산정')
    .setFontWeight('bold')
    .setBackground('#245b87')
    .setFontColor('#ffffff');


  const scaleData = [

    ['항목', '결과', '단위', '계산식'],

    [
      '건축면적',
      buildingArea,
      '평',
      '대지면적 × 건폐율'
    ],

    [
      '용적률 산정 연면적',
      farArea,
      '평',
      '대지면적 × 용적률'
    ],

    [
      '용적률 제외면적',
      nonFarArea,
      '평',
      '용적률 산정 연면적 × 제외면적 비율'
    ],

    [
      '공사비 산정 총 연면적',
      constructionArea,
      '평',
      '용적률 산정 연면적 × (1 + 제외면적 비율)'
    ],

    [
      '분양면적',
      saleArea,
      '평',
      '용적률 산정 연면적 × 분양면적 비율'
    ]

  ];

  sheet.getRange(
    24,
    1,
    scaleData.length,
    4
  ).setValues(scaleData);


  // ==========================================
  // 9. 예상 비용 및 사업수지
  // ==========================================

  sheet.getRange('A31:D31')
    .merge()
    .setValue('3. 예상 비용 및 사업수지')
    .setFontWeight('bold')
    .setBackground('#245b87')
    .setFontColor('#ffffff');


  const costData = [

    ['항목', '결과', '단위', '계산기준'],

    [
      '총 분양수입',
      salesRevenue,
      '억원',
      '분양면적 × 평당 분양단가'
    ],

    [
      '직접공사비',
      directConstructionCost,
      '억원',
      '공사비 산정 연면적 × 평당 공사비'
    ],

    [
      '기타사업비',
      otherCost,
      '억원',
      '직접공사비 × 기타사업비율'
    ],

    [
      '건설금융비용',
      constructionFinanceCost,
      '억원',
      '(공사비+기타사업비) × 50% × 차입비율 × 이자율 × 사업기간'
    ],

    [
      '토지취득 부대비',
      landAcquisitionCost,
      '억원',
      '토지가격 × 토지취득 부대비율'
    ],

    [
      '토지금융비용',
      landFinanceCost,
      '억원',
      '토지가격 × 차입비율 × 이자율 × 사업기간'
    ],

    [
      '총 사업비',
      totalProjectCost,
      '억원',
      '토지비 포함 전체 사업비'
    ],

    [
      '개발이익',
      developmentProfit,
      '억원',
      '총 분양수입 - 총 사업비'
    ],

    [
      '개발이익률',
      developmentProfitRate,
      '%',
      '개발이익 ÷ 총 분양수입'
    ]

  ];

  sheet.getRange(
    32,
    1,
    costData.length,
    4
  ).setValues(costData);


  // ==========================================
  // 10. 적정 토지가격
  // ==========================================

  sheet.getRange('A43:D43')
    .merge()
    .setValue('4. 적정 토지가격 산정')
    .setFontWeight('bold')
    .setBackground('#245b87')
    .setFontColor('#ffffff');


  const landData = [

    ['항목', '결과', '단위', '설명'],

    [
      '목표이익',
      targetProfit,
      '억원',
      '총 분양수입 × 목표이익률'
    ],

    [
      '검토 토지가격',
      landPrice,
      '억원',
      '과거 거래가격 참고'
    ],

    [
      '적정 토지가격',
      appropriateLandPrice,
      '억원',
      '목표이익 확보 후 지급 가능한 최대 토지가격'
    ],

    [
      '토지 매입 여유액',
      landPriceGap,
      '억원',
      '적정 토지가격 - 검토 토지가격'
    ],

    [
      '최종 판정',
      status,
      '',
      '적정 토지가격과 검토 토지가격 비교'
    ]

  ];

  sheet.getRange(
    44,
    1,
    landData.length,
    4
  ).setValues(landData);


  // ==========================================
  // 11. 표 디자인
  // ==========================================

  const headerRanges = [
    'A7:D7',
    'A24:D24',
    'A32:D32',
    'A44:D44'
  ];

  headerRanges.forEach(function(range) {

    sheet.getRange(range)
      .setFontWeight('bold')
      .setBackground('#eaf2f8');

  });


  // 숫자 표시
  sheet.getRange('B8:B48')
    .setNumberFormat('#,##0.00');


  // 기본 숫자
sheet.getRange('B8:B48')
  .setNumberFormat('#,##0.00');

// 비율
sheet.getRange('B10:B13')
  .setNumberFormat('0.00%');

sheet.getRange('B16:B18')
  .setNumberFormat('0.00%');

sheet.getRange('B20:B21')
  .setNumberFormat('0.00%');

// 사업기간은 퍼센트가 아니라 개월
sheet.getRange('B19')
  .setNumberFormat('0');

// 개발이익률
sheet.getRange('B41')
  .setNumberFormat('0.00%');


  // 열 너비
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 190);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 390);


  // 전체 정렬
  sheet.getRange('A1:D48')
    .setVerticalAlignment('middle')
    .setWrap(true);


  SpreadsheetApp.flush();


  // 완료 메시지
  return '여의도 사업성 분석표 생성 완료';

}