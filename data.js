/**
 * AI 기반 맞춤형 분리수거 안내 시스템 - 지역 및 품목 데이터베이스
 * 출처: 환경부 생활폐기물 분리배출 누리집 (분리배출.kr) & 공공데이터포털 기준 반영
 */

// 1. 전국 지역 데이터 (시도 및 주요 시군구, 지역별 수거 체계)
const REGION_DATABASE = {
    "제주특별자치도": {
        subRegions: ["제주시", "서귀포시"],
        specialRules: {
            systemName: "재활용도움센터 & 클린하우스 요일별 배출제",
            description: "제주도는 거점수거 방식(클린하우스 및 재활용도움센터)을 운영합니다. 클린하우스는 요일별 배출 품목이 정해져 있으며, 재활용도움센터는 요일에 상관없이 배출 가능합니다.",
            schedule: {
                "월요일": "플라스틱류 (투명페트병, 일반 플라스틱)",
                "화요일": "종이류, 병류, 불연성 종량제",
                "수요일": "캔·고철류",
                "목요일": "스티로폼, 비닐류",
                "금요일": "플라스틱류 (투명페트병, 일반 플라스틱)",
                "토요일": "불연성(깨진 유리 등), 병류, 캔·고철",
                "일요일": "스티로폼, 비닐류, 종이류"
            },
            notes: "투명 페트병은 라벨 제거 후 내용물을 비우고 압착하여 전용 수거함에 배출해야 합니다. 재활용도움센터 이용 시 종량제 봉투 교환 혜택(빈 캔, 투명페트병 수거 보상)이 있을 수 있습니다."
        }
    },
    "서울특별시": {
        subRegions: ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
        specialRules: {
            systemName: "투명 페트병·비닐 분리배출 요일제 & 문전수거",
            description: "단독주택 및 상가지역은 지정된 요일(목요일 또는 금요일, 자치구별 상이)에 '투명 페트병'과 '폐비닐'만 따로 배출해야 합니다. 아파트는 단지 내 전용 수거함 상시 배출.",
            schedule: {
                "목요일/금요일": "투명 페트병 & 비닐류만 전용 봉투 배출 (자치구별 지정요일 준수)",
                "기타 요일": "일반 재활용품(종이, 캔, 유리, 기타 플라스틱) 배출"
            },
            notes: "배출 시간은 일몰 후(저녁 7시~밤 12시) 본인 집 앞 문전배출이 원칙입니다. 낮 시간대 배출 시 과태료가 부과될 수 있습니다."
        }
    },
    "경기도": {
        subRegions: ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시", "의정부시", "시흥시", "파주시", "광명시", "김포시", "군포시", "광주시", "이천시", "양주시", "오산시", "구리시", "안성시", "포천시", "의왕시", "하남시", "여주시", "양평군", "동두천시", "과천시", "가평군", "연천군"],
        specialRules: {
            systemName: "문전 배출 및 거점 분리배출 체계",
            description: "대부분 지자체가 문전수거를 기본으로 하며, 주 3회 또는 격일제 배출을 시행합니다.",
            schedule: {
                "안내": "시·군·구 조례에 따라 동별 배출 요일이 상이하므로 거주지 주민센터 수거 일정을 반드시 확인하세요."
            },
            notes: "투명 페트병 별도 분리배출 의무화 적용. 스티로폼과 비닐은 이물질이 없도록 투명 비닐봉투에 모아서 배출합니다."
        }
    },
    "부산광역시": {
        subRegions: ["중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구", "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군"],
        specialRules: {
            systemName: "문전 수거제 및 요일별 배출",
            description: "재활용품은 품목별로 묶거나 투명 봉투에 담아 지정된 요일 저녁에 집 앞에 배출합니다.",
            notes: "음식물 쓰레기 전용 수거용기 칩 방식 또는 RFID 종량기 사용 구역이 많습니다."
        }
    },
    "인천광역시": {
        subRegions: ["중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"],
        specialRules: {
            systemName: "재활용품 전용 봉투 및 요일제",
            description: "일부 자치구에서 재활용 전용 그물망 또는 투명봉투 배출제를 시행하고 있습니다."
        }
    },
    "대구광역시": {
        subRegions: ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"],
        specialRules: {
            systemName: "문전 배출제 (일몰 후 배출)",
            description: "재활용품 종류별 분리 후 투명 봉투에 담아 지정 요일 저녁 배출."
        }
    },
    "대전광역시": {
        subRegions: ["동구", "중구", "서구", "유성구", "대덕구"],
        specialRules: {
            systemName: "재활용품 요일별 문전배출 체계",
            description: "단독주택 지역은 정해진 요일 저녁 집 앞 배출, 공동주택은 상시 배출."
        }
    },
    "광주광역시": {
        subRegions: ["동구", "서구", "남구", "북구", "광산구"],
        specialRules: {
            systemName: "재활용품 요일별 수거제",
            description: "품목별 묶음 배출 및 투명 페트병 별도 분리수거 의무화 시행."
        }
    },
    "울산광역시": {
        subRegions: ["중구", "남구", "동구", "북구", "울주군"],
        specialRules: {
            systemName: "문전 수거 및 품목별 분리배출",
            description: "지정 요일 일몰 후 집 앞 배출."
        }
    },
    "세종특별자치시": {
        subRegions: ["세종시"],
        specialRules: {
            systemName: "자동집하시설(크린넷) 및 거점 분리수거",
            description: "신도시 지역은 크린넷(자동집하시설)을 통해 일반·음식물 쓰레기를 투입하며, 재활용품은 단지 및 거점 수거함에 배출합니다."
        }
    },
    "강원특별자치도": {
        subRegions: ["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군"],
        specialRules: {
            systemName: "지역 거점 클린하우스 및 문전배출 혼합",
            description: "농어촌 지역은 마을 공동 집하장 및 영농폐기물 수거장소를 운영합니다."
        }
    },
    "충청북도": {
        subRegions: ["청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"],
        specialRules: { systemName: "지자체별 요일제 배출" }
    },
    "충청남도": {
        subRegions: ["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"],
        specialRules: { systemName: "지자체별 요일제 배출" }
    },
    "전북특별자치도": {
        subRegions: ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"],
        specialRules: { systemName: "지자체별 요일제 배출" }
    },
    "전라남도": {
        subRegions: ["목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"],
        specialRules: { systemName: "도서·연안 해양쓰레기 수거 및 요일제" }
    },
    "경상북도": {
        subRegions: ["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"],
        specialRules: { systemName: "지자체별 문전 및 거점 배출" }
    },
    "경상남도": {
        subRegions: ["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군"],
        specialRules: { systemName: "지자체별 문전 및 거점 배출" }
    }
};

// 2. 환경부 분리배출 4대 핵심 원칙
const CORE_PRINCIPLES = [
    { title: "비운다", desc: "용기 안의 내용물은 깨끗이 비우고 배출합니다.", icon: "🗑️" },
    { title: "헹군다", desc: "이물질이나 음식물이 묻어있다면 물로 깨끗이 헹굽니다.", icon: "💧" },
    { title: "분리한다", desc: "라벨, 뚜껑, 테이프 등 다른 재질은 모두 떼어냅니다.", icon: "✂️" },
    { title: "섞지 않는다", desc: "종류별, 재질별로 나누어 지정된 수거함에 배출합니다.", icon: "📦" }
];

// 3. 물품별 상세 분리배출 가이드 데이터베이스 (환경부 분리배출.kr 기준)
const ITEM_DATABASE = [
    {
        id: "pet_clear",
        name: "투명 페트병 (생수병, 음료병)",
        keywords: ["투명페트병", "생수병", "생수통", "음료병", "투명페트", "물병", "깨끗한 페트병", "페트병"],
        category: "투명 페트병 전용",
        categoryColor: "#10b981", // green
        disposalMethod: "투명 페트병 전용 수거함 (또는 전용 배출 요일에 유색 플라스틱과 구분하여 배출)",
        steps: [
            "1. 내용물을 완전히 비우고 물로 깨끗이 헹굽니다.",
            "2. 비닐 라벨을 가위나 손으로 완전히 뜯어 비닐류로 따로 배출합니다.",
            "3. 부피를 줄이기 위해 발로 밟거나 손으로 찌그러뜨립니다.",
            "4. 뚜껑을 닫아서(또는 뚜껑도 따로 모아) 투명 페트병 전용함에 넣습니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: true,
        specialWarning: "유색 페트병(갈색 맥주병, 초록색 사이다병 등)이나 양념류 페트병은 '일반 플라스틱'으로 분류해야 합니다.",
        ecoTip: "투명 페트병은 고품질 재생원료(의류용 장섬유 등)로 재활용되는 귀중한 자원입니다."
    },
    {
        id: "pet_colored",
        name: "유색 플라스틱 페트병 (녹색 사이다병, 갈색 맥주병 등)",
        keywords: ["유색페트병", "초록페트병", "갈색페트병", "맥주페트병", "사이다페트병", "색깔페트병", "유색 페트병"],
        category: "일반 플라스틱류",
        categoryColor: "#059669",
        disposalMethod: "일반 플라스틱(플라스틱류) 수거함에 배출",
        steps: [
            "1. 내용물을 깨끗이 비우고 물로 헹굽니다.",
            "2. 겉면 비닐 라벨을 제거하여 비닐류로 분리합니다.",
            "3. 압착 후 뚜껑을 닫아 일반 플라스틱으로 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: false,
        specialWarning: "투명 페트병 전용 수거함에 섞여 들어가면 고품질 재활용 공정을 방해하므로 반드시 일반 플라스틱으로 분리하세요."
    },
    {
        id: "plastic_container_clean",
        name: "깨끗한 플라스틱 배달용기 / 반찬통",
        keywords: ["깨끗한 배달용기", "플라스틱 용기", "반찬통", "플라스틱 뚜껑", "깨끗한 플라스틱 용기", "배달용기", "밀폐용기"],
        category: "플라스틱류",
        categoryColor: "#0284c7",
        disposalMethod: "플라스틱류 수거함에 배출",
        steps: [
            "1. 음식물 찌꺼기가 남지 않도록 세제로 깨끗이 씻습니다.",
            "2. 붙어있는 스티커나 비닐 실링을 완벽히 제거합니다.",
            "3. 물기를 말린 후 플라스틱 수거함에 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: false,
        specialWarning: "기름기나 고추기름이 플라스틱 재질에 깊게 배어 씻어도 지워지지 않는 용기는 재활용이 불가능하므로 '종량제 일반쓰레기'로 버려야 합니다."
    },
    {
        id: "plastic_container_dirty",
        name: "오염된 배달용기 / 고추기름 밴 플라스틱",
        keywords: ["더러운 배달용기", "오염된 플라스틱", "빨간 배달용기", "기름 묻은 용기", "씻기지 않는 용기", "마라탕 용기", "떡볶이 용기"],
        category: "종량제 봉투 (일반쓰레기)",
        categoryColor: "#dc2626", // red
        disposalMethod: "일반 종량제 봉투에 담아 배출",
        steps: [
            "1. 여러 번 씻어도 붉은 양념이나 기름때가 지워지지 않는다면 재활용이 불가능합니다.",
            "2. 일반 종량제 쓰레기봉투에 넣어 버립니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "오염된 플라스틱을 분리수거함에 넣으면 다른 깨끗한 재활용품까지 오염시켜 전체가 소각·매립 처리됩니다."
    },
    {
        id: "ramen_cup_clean",
        name: "깨끗이 씻은 컵라면 용기 (스티로폼/종이)",
        keywords: ["깨끗한 컵라면", "씻은 컵라면", "하얀 컵라면 용기"],
        category: "스티로폼류 또는 종이팩류 (재질 확인)",
        categoryColor: "#f59e0b",
        disposalMethod: "재질 표기(PS: 스티로폼, 종이: 종이류)에 맞춰 분리배출",
        steps: [
            "1. 국물 자국이 전혀 남지 않도록 햇빛에 말리거나 깨끗이 씻습니다.",
            "2. 은박 뚜껑은 떼어 일반쓰레기로 버립니다.",
            "3. 하얗게 세척된 스티로폼 용기는 스티로폼 전용함에 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: false,
        specialWarning: "조금이라도 국물 자국이나 오염이 남아있다면 반드시 종량제 봉투에 버리세요."
    },
    {
        id: "ramen_cup_dirty",
        name: "기름때/국물 밴 컵라면 용기",
        keywords: ["컵라면 용기", "컵라면", "라면용기", "오염된 컵라면", "빨간 컵라면", "사발면 용기"],
        category: "종량제 봉투 (일반쓰레기)",
        categoryColor: "#dc2626",
        disposalMethod: "일반 종량제 봉투에 담아 배출",
        steps: [
            "1. 국물 자국이나 기름이 깊게 밴 컵라면 용기는 재활용이 되지 않습니다.",
            "2. 일반 종량제 봉투에 배출합니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "대부분의 컵라면 용기는 국물이 배어 재활용이 어렵습니다. 완전히 흰색으로 씻긴 것만 재활용 가능합니다."
    },
    {
        id: "pizza_box_clean",
        name: "깨끗한 피자 박스 / 택배 상자 (종이류)",
        keywords: ["깨끗한 피자박스", "피자박스 뚜껑", "택배상자", "택배박스", "종이상자", "골판지상자", "종이박스"],
        category: "종이류 (골판지)",
        categoryColor: "#b45309",
        disposalMethod: "상자류를 납작하게 접어 종이류로 배출",
        steps: [
            "1. 택배 운송장 스티커, 박스 테이프를 완전히 떼어냅니다.",
            "2. 박스 안의 스티로폼, 비닐 등 완충재를 모두 꺼냅니다.",
            "3. 상자를 납작하게 펼쳐 끈으로 묶거나 한 상자에 모아 배출합니다."
        ],
        washRequired: false,
        labelRemovalRequired: true,
        separateDisposal: false,
        specialWarning: "비닐 테이프와 운송장 스티커는 종이 재활용 과정에서 치명적인 불순물이 되므로 반드시 꼼꼼히 떼어내야 합니다."
    },
    {
        id: "pizza_box_greasy",
        name: "기름이나 양념 묻은 피자 박스 바닥",
        keywords: ["기름 묻은 피자박스", "오염된 피자박스", "치킨박스 기름", "기름진 종이상자", "피자박스"],
        category: "종량제 봉투 (일반쓰레기)",
        categoryColor: "#dc2626",
        disposalMethod: "일반 종량제 봉투에 담아 배출 (깨끗한 뚜껑 부분은 잘라서 종이류 가능)",
        steps: [
            "1. 기름과 치즈가 묻은 바닥 부분은 종이 재활용이 절대 불가능하므로 잘라서 '일반쓰레기'로 버립니다.",
            "2. 기름이 전혀 묻지 않은 깨끗한 뚜껑 부분만 분리하여 종이류로 배출할 수 있습니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "음식물 기름이 스며든 종이는 재생 펄프 제조 시 기름막을 형성해 다른 종이까지 못 쓰게 만듭니다."
    },
    {
        id: "broken_glass",
        name: "깨진 유리 / 사기그릇 / 거울 / 도자기",
        keywords: ["깨진 유리", "깨진 거울", "사기그릇", "도자기", "깨진 컵", "유리조각", "도기류", "화분", "내열유리"],
        category: "불연성 종량제 마대 (특수규격봉투)",
        categoryColor: "#7c3aed", // purple
        disposalMethod: "지자체 불연성 종량제 마대(특수규격마대) 구입 후 배출",
        steps: [
            "1. 수거 작업자가 다치지 않도록 신문지나 두꺼운 종이로 꼼꼼히 감쌉니다.",
            "2. 겉면에 '깨진 유리 주의'라고 유성펜으로 크게 표기합니다.",
            "3. 주민센터나 지정 판매처에서 구매한 '불연성 쓰레기 전용 마대'에 넣어 배출합니다.",
            "4. 소량이고 지자체에 전용마대가 없다면 일반 종량제에 두껍게 싸서 '유리 위험' 메모를 붙여 배출하세요."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "일반 음료 유리병과 달리 사기, 도자기, 내열유리(락앤락 글라스 등), 거울은 녹는점이 달라 재활용이 되지 않습니다. 절대 유리병 수거함에 넣지 마세요!"
    },
    {
        id: "glass_bottle_clean",
        name: "음료수·맥주·소주 유리병 (빈용기보증금 대상/일반)",
        keywords: ["유리병", "맥주병", "소주병", "음료병", "와인병", "잼병", "유리용기", "유리"],
        category: "유리병류 (빈용기보증금 환급 가능)",
        categoryColor: "#0d9488",
        disposalMethod: "소주·맥주병은 마트/편의점 보증금 환급, 기타 유리병은 유리병 수거함 배출",
        steps: [
            "1. 병 안의 담배꽁초나 이물질을 깨끗이 비우고 물로 헹굽니다.",
            "2. 플라스틱 또는 쇠 뚜껑은 분리하여 해당 재질로 버립니다.",
            "3. 소주·맥주병(보증금 표시 마크 확인)은 깨끗한 상태로 마트에 반환하면 병당 100~130원의 보증금을 돌려받을 수 있습니다.",
            "4. 깨지지 않은 상태로 유리병 전용함에 조심스럽게 넣습니다."
        ],
        washRequired: true,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "병 속에 담배꽁초, 휴지 등을 넣으면 재사용 및 재활용이 불가능해집니다."
    },
    {
        id: "battery",
        name: "폐건전지 / 보조배터리 / 리튬이온 배터리",
        keywords: ["건전지", "폐건전지", "배터리", "보조배터리", "충전기 배터리", "리튬배터리", "수은전지"],
        category: "폐건전지 전용 수거함 (별도 수거)",
        categoryColor: "#e11d48",
        disposalMethod: "동주민센터, 아파트 단지, 지하철역 전용 폐건전지 수거함에 배출",
        steps: [
            "1. 절대 일반 종량제 봉투에 버리지 마세요 (쓰레기 수거차량 및 처리시설 화재의 주원인).",
            "2. 전극 부위에 화재 예방을 위해 절연테이프나 스카치테이프를 붙여두면 더욱 안전합니다.",
            "3. 가까운 주민센터, 아파트 전용 수거함, 학교나 마트 수거함에 투입합니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "리튬이온 배터리는 압착 시 폭발 및 대형 화재를 유발합니다. 반드시 전용 수거함에 별도 배출해야 합니다."
    },
    {
        id: "medicine",
        name: "폐의약품 (남은 약, 알약, 시럽제, 연고)",
        keywords: ["폐의약품", "남은약", "약", "알약", "감기약", "처방약", "시럽", "안약", "물약"],
        category: "폐의약품 전용 수거함 (별도 수거)",
        categoryColor: "#6366f1",
        disposalMethod: "가까운 약국, 보건소, 주민센터 내 폐의약품 수거함 배출",
        steps: [
            "1. 알약은 포장재(PTP, 플라스틱)를 까서 알약끼리만 한 비닐봉투에 모읍니다.",
            "2. 가루약은 포장지 그대로 모아 배출합니다.",
            "3. 물약/시럽제는 한 병에 모아서 새지 않도록 뚜껑을 꼭 닫아 배출합니다.",
            "4. 절대 하수구, 변기에 버리거나 일반쓰레기로 버리지 마세요."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "약품을 하수구에 버리면 하수처리장에서 걸러지지 않고 하천과 토양을 심각하게 오염시키며 생태계 교란 및 슈퍼박테리아를 유발합니다."
    },
    {
        id: "icepack_gel",
        name: "고흡수성수지 젤 아이스팩 (미세플라스틱 젤)",
        keywords: ["아이스팩", "젤아이스팩", "젤 아이스팩", "고흡수성수지 아이스팩", "화학 아이스팩"],
        category: "종량제 봉투 (일반쓰레기) 또는 전용 수거함",
        categoryColor: "#ea580c",
        disposalMethod: "원형 그대로 종량제 봉투 배출 (또는 지자체 전용 수거함)",
        steps: [
            "1. 팩을 뜯지 말고 통째로 종량제 쓰레기봉투에 넣어 버립니다.",
            "2. 지자체 주민센터에 '아이스팩 전용 수거함'이 있는 경우 모아서 가져가면 재사용됩니다.",
            "3. 절대 싱크대나 하수구에 젤을 짜서 흘려보내지 마세요."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "젤 성분은 미세플라스틱의 일종인 고흡수성 폴리머(SAP)입니다. 하수구에 버리면 하천 오염 및 하수관 막힘이 일어납니다."
    },
    {
        id: "icepack_water",
        name: "친환경 물 아이스팩 (순수 물 성분)",
        keywords: ["친환경 아이스팩", "물 아이스팩", "종이 아이스팩", "워터 아이스팩"],
        category: "물은 하수구, 겉봉투는 비닐/종이 분리배출",
        categoryColor: "#0284c7",
        disposalMethod: "가위로 잘라 물은 싱크대에 버리고, 포장재 재질별 분리배출",
        steps: [
            "1. 포장지 겉면에 '물 100%' 문구를 확인합니다.",
            "2. 가위로 모서리를 자르고 안의 순수한 물은 싱크대에 쏟아버립니다.",
            "3. 겉봉투가 비닐이면 비닐류로, 종이코팅이면 종량제봉투 또는 표기재질에 맞게 배출합니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "물 100%인지 반드시 확인 후 찢으세요. 젤 형태라면 절대 찢지 마세요."
    },
    {
        id: "styrofoam_clean",
        name: "깨끗한 스티로폼 상자 / 완충재",
        keywords: ["스티로폼", "스티로폼박스", "깨끗한 스티로폼", "흰색 스티로폼", "발포스티렌", "가전제품 완충재"],
        category: "스티로폼류 (EPS)",
        categoryColor: "#059669",
        disposalMethod: "흰색 스티로폼만 모아 스티로폼 전용함 배출",
        steps: [
            "1. 부착된 택배 송장 테이프와 비닐 스티커를 칼이나 손으로 남김없이 뗍니다.",
            "2. 상자 안에 묻은 얼룩이나 생선 비린내 등을 물로 깨끗이 씻어냅니다.",
            "3. 깨끗하고 순수한 흰색 스티로폼만 묶거나 전용 수거함에 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: false,
        specialWarning: "유색 스티로폼, 코팅된 과일 포장재, 건축용 단열재 스티로폼은 재활용 불가(종량제 배출)입니다."
    },
    {
        id: "vinyl_clean",
        name: "깨끗한 비닐 / 과자봉지 / 뽁뽁이(에어캡)",
        keywords: ["비닐", "비닐봉지", "뽁뽁이", "에어캡", "과자봉지", "라면봉지", "비닐류", "투명비닐", "검은비닐"],
        category: "비닐류 (비닐 포장재)",
        categoryColor: "#0d9488",
        disposalMethod: "투명/반투명 비닐봉투에 모아 비닐류로 배출",
        steps: [
            "1. 비닐 안의 음식물 찌꺼기나 가루를 완전히 털고 헹굽니다.",
            "2. 겉면에 붙은 종이 스티커나 테이프를 가위로 오려냅니다.",
            "3. 흩날리지 않도록 투명 봉투 하나에 여러 비닐을 모아 묶어서 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: false,
        specialWarning: "비닐을 딱지 모양으로 접어 버리면 선별장 기계에서 재질 인식이 어려우므로 넓게 펼치거나 가볍게 묶어서 배출하세요."
    },
    {
        id: "vinyl_dirty",
        name: "기름이나 양념 묻은 비닐 / 랩(가정용 랩)",
        keywords: ["오염된 비닐", "기름 묻은 비닐", "양념 비닐", "음식물 묻은 비닐", "랩", "비닐랩"],
        category: "종량제 봉투 (일반쓰레기)",
        categoryColor: "#dc2626",
        disposalMethod: "일반 종량제 봉투에 담아 배출",
        steps: [
            "1. 음식물이나 기름이 묻어 씻기지 않는 비닐은 재활용이 되지 않습니다.",
            "2. 업소용/가정용 얇은 비닐랩(PVC 재질)은 재활용 선별기를 고장내므로 종량제 봉투에 버립니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "오염된 비닐은 비닐 재활용 연료(SRF)의 품질을 떨어뜨립니다."
    },
    {
        id: "can_metal",
        name: "음료캔 / 통조림통 / 부탄가스 / 살충제캔",
        keywords: ["캔", "음료수캔", "통조림", "참치캔", "스팸캔", "부탄가스", "에프킬라", "살충제", "스프레이캔", "고철"],
        category: "캔류 / 고철류",
        categoryColor: "#475569",
        disposalMethod: "캔류 전용 수거함에 배출 (가스캔은 반드시 구멍 뚫기)",
        steps: [
            "1. 음료캔 및 통조림은 내용물을 비우고 물로 헹굽니다.",
            "2. 통조림 뚜껑 등 날카로운 부분은 안으로 밀어 넣거나 조심합니다.",
            "3. 부탄가스, 스프레이캔은 통풍이 잘되는 야외에서 노즐을 눌러 가스를 완전히 뺀 뒤, 캔 밑바닥에 구멍을 뚫어 배출합니다.",
            "4. 캔을 발로 찌그러뜨려 부피를 줄여 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: false,
        separateDisposal: false,
        specialWarning: "가스가 남아있는 부탄가스캔은 쓰레기 수거차량 압축 과정에서 대형 폭발 화재를 일으킵니다. 반드시 잔여 가스를 빼고 배출하세요."
    },
    {
        id: "paper_pack",
        name: "우유팩 / 두유팩 / 주스 종이팩 (멸균팩 포함)",
        keywords: ["우유팩", "종이팩", "우유상자", "멸균팩", "두유팩", "주스팩"],
        category: "종이팩 전용 수거함 (일반 종이류와 별도 분리)",
        categoryColor: "#0284c7",
        disposalMethod: "종이팩 전용 수거함 배출 또는 주민센터 화장지 교환 사업 활용",
        steps: [
            "1. 우유나 음료 내용물을 물로 깨끗이 헹굽니다.",
            "2. 가위로 모서리를 잘라 네모나게 펼친 뒤 햇볕에 바짝 말립니다.",
            "3. 플라스틱 빨대나 뚜껑은 분리하여 플라스틱류로 버립니다.",
            "4. 일반 신문/박스와 섞지 말고 '종이팩 전용함'에 배출합니다."
        ],
        washRequired: true,
        labelRemovalRequired: true,
        separateDisposal: true,
        specialWarning: "종이팩은 고급 100% 천연펄프로 만들어져 일반 종이와 재활용 공정이 완전히 다릅니다. 일반 종이 상자에 섞으면 대부분 폐기 처리됩니다. 동주민센터에 모아가면 롤 화장지나 종량제 봉투로 교환해주는 지자체가 많습니다."
    },
    {
        id: "fluorescent_lamp",
        name: "형광등 / 삼파장 램프",
        keywords: ["형광등", "삼파장램프", "전구", "램프"],
        category: "폐형광등 전용 수거함 (별도 수거)",
        categoryColor: "#d97706",
        disposalMethod: "아파트 단지나 주민센터 폐형광등 전용 수거함에 깨지지 않게 배출",
        steps: [
            "1. 수은 가스가 누출되지 않도록 절대 깨뜨리지 마세요.",
            "2. 새 형광등 종이케이스가 있다면 넣어서 전용 수거함에 안전하게 넣습니다.",
            "3. 이미 깨진 형광등은 신문지에 싸서 '불연성 종량제 마대'에 버려야 합니다.",
            "4. 백열전구와 깨진 LED 전구는 재활용 대상이 아니므로 종량제 봉투에 버립니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "형광등 내부에는 인체에 치명적인 유독 수은 증기가 들어있습니다. 깨지지 않도록 극히 주의하세요."
    },
    {
        id: "clothes_fabric",
        name: "헌옷 / 신발 / 가방 / 담요",
        keywords: ["헌옷", "옷", "의류", "신발", "가방", "모자", "커튼", "담요"],
        category: "의류 수거함 배출",
        categoryColor: "#8b5cf6",
        disposalMethod: "골목길 및 단지 내 의류 수거함 투입",
        steps: [
            "1. 찢어지거나 오염되지 않아 재사용이 가능한 의류만 넣습니다.",
            "2. 신발은 짝이 맞도록 끈으로 묶어 넣습니다.",
            "3. 솜이불, 베개, 여행용 캐리어, 바퀴달린 신발(인라인)은 수거 불가 품목이므로 대형폐기물이나 종량제봉투에 버립니다."
        ],
        washRequired: true,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "솜이불, 방석, 바퀴달린 가방 등은 의류수거함 투입 금지 품목입니다."
    },
    {
        id: "small_appliance",
        name: "소형 폐가전 (헤어드라이기, 선풍기, 전기밥솥, 토스터기 등)",
        keywords: ["소형가전", "헤어드라이기", "드라이기", "선풍기", "전기밥솥", "토스터기", "다리미", "키보드", "마우스", "프린터"],
        category: "소형 폐가전 무료 수거함 / 주민센터 배출",
        categoryColor: "#3b82f6",
        disposalMethod: "주민센터 소형가전 전용함 배출 또는 폐가전 무상방문수거(5개 이상) 신청",
        steps: [
            "1. 전원선과 본체를 훼손하지 않고 그대로 배출합니다.",
            "2. 단지 내 소형가전 전용 수거함이나 주민센터에 무료 배출합니다.",
            "3. 소형 가전제품이 5개 이상일 경우 '순환거버넌스 폐가전 무상방문수거(1599-0903)'를 통해 집에서 무료 수거 가능합니다."
        ],
        washRequired: false,
        labelRemovalRequired: false,
        separateDisposal: true,
        specialWarning: "스티커(대형폐기물 수수료)를 붙이지 않고 무료로 버릴 수 있는 소형가전 품목인지 확인하세요."
    }
];

// 4. 모호하거나 특수 처리가 필요한 복합 물품 안내 가이드
const AMBIGUOUS_CASES = {
    "거울": "거울은 일반 유리와 녹는점이 다르고 뒷면에 은 코팅이 되어 있어 재활용이 불가능합니다. 깨뜨리지 않고 불연성 마대(특수규격마대)에 넣어 버려야 합니다.",
    "장난감": "플라스틱 장난감은 내부에 모터, 건전지, 금속 나사 등이 섞인 복합 재질이 많습니다. 금속/전지 분리가 안 되면 종량제 봉투에 버리세요.",
    "스프링노트": "스프링 노트는 철 스프링이나 플라스틱 스프링을 반드시 펜치나 손으로 뜯어내고, 종이만 모아서 배출해야 합니다.",
    "영수증": "감열지 영수증은 화학약품(비스페놀A 등)이 코팅되어 있어 종이 재활용이 되지 않습니다. 일반 종량제 봉투에 버리세요.",
    "전단지": "비닐 코팅된 화려한 광택 전단지, 방수 코팅 달력은 재활용 불가(종량제 봉투)입니다. 찢었을 때 비닐막이 늘어나는지 확인하세요.",
    "기저귀": "사용한 기저귀 및 생리대는 위생용품으로 재활용이 불가능하므로 일반 종량제 봉투에 밀봉하여 버립니다.",
    "치킨뼈": "치킨 뼈, 소/돼지 갈비뼈, 조개 껍데기, 달걀 껍데기는 동물의 사료로 쓸 수 없으므로 '음식물 쓰레기'가 아닌 '일반 종량제 쓰레기'입니다."
};

// 5. 인공지능 지도학습(Supervised Learning) 훈련 데이터셋 (X: 특징 텍스트, Y: 정답 분류 레이블)
// 고교 인공지능 기초 교과서 지도학습(분류) 실습용 정제 데이터셋 (총 80개 샘플)
const TRAINING_DATASET = [
    // 1. 투명 페트병 (pet_clear)
    { text: "물로 깨끗이 헹군 투명 생수병", label: "pet_clear" },
    { text: "비닐 라벨 뗀 맑은 생수 페트병", label: "pet_clear" },
    { text: "발로 밟아 압착한 투명 음료수 페트병", label: "pet_clear" },
    { text: "뚜껑 닫은 투명 탄산수 페트병", label: "pet_clear" },
    { text: "깨끗한 500ml 투명 생수통", label: "pet_clear" },
    { text: "라벨 제거한 2리터 투명 생수 페트", label: "pet_clear" },

    // 2. 유색 페트병 (pet_colored)
    { text: "갈색 맥주 페트병", label: "pet_colored" },
    { text: "초록색 사이다 페트병", label: "pet_colored" },
    { text: "유색 플라스틱 막걸리병", label: "pet_colored" },
    { text: "색깔 있는 양념 플라스틱 페트병", label: "pet_colored" },
    { text: "초록색 탄산음료 페트병 헹굼", label: "pet_colored" },

    // 3. 깨끗한 플라스틱 용기 (plastic_container_clean)
    { text: "주방세제로 기름기 없이 깨끗이 씻은 배달용기", label: "plastic_container_clean" },
    { text: "물기 말린 하얀색 플라스틱 반찬통", label: "plastic_container_clean" },
    { text: "스티커 뗀 투명 플라스틱 포장 트레이", label: "plastic_container_clean" },
    { text: "깨끗한 플라스틱 커피 컵 테이크아웃", label: "plastic_container_clean" },
    { text: "씻은 샴푸통 바디워시 플라스틱 용기", label: "plastic_container_clean" },

    // 4. 오염된 플라스틱 용기 (plastic_container_dirty)
    { text: "마라탕 고추기름 붉게 물든 플라스틱 배달용기", label: "plastic_container_dirty" },
    { text: "떡볶이 양념 자국이 안 지워지는 플라스틱 통", label: "plastic_container_dirty" },
    { text: "기름때 찌든 일회용 플라스틱 도시락", label: "plastic_container_dirty" },
    { text: "음식물 찌꺼기 묻은 더러운 플라스틱", label: "plastic_container_dirty" },
    { text: "카레 양념 노랗게 착색된 플라스틱 용기", label: "plastic_container_dirty" },

    // 5. 컵라면 용기 깨끗함 vs 오염됨
    { text: "햇빛에 바짝 말려 하얗게 세척된 스티로폼 컵라면", label: "ramen_cup_clean" },
    { text: "국물 자국 전혀 없는 씻은 컵라면 용기", label: "ramen_cup_clean" },
    { text: "빨간 라면 국물 배어있는 컵라면 용기", label: "ramen_cup_dirty" },
    { text: "기름기 묻은 사발면 스티로폼 용기", label: "ramen_cup_dirty" },

    // 6. 피자박스 / 택배상자 (깨끗함 vs 기름 묻음)
    { text: "테이프와 송장 스티커 전부 뗀 깨끗한 택배상자", label: "pizza_box_clean" },
    { text: "기름 안 묻은 깨끗한 피자박스 뚜껑 종이", label: "pizza_box_clean" },
    { text: "납작하게 접은 마트 종이 골판지 박스", label: "pizza_box_clean" },
    { text: "치즈와 피자 기름 잔뜩 스며든 피자박스 바닥", label: "pizza_box_greasy" },
    { text: "양념치킨 기름 묻은 종이 상자", label: "pizza_box_greasy" },
    { text: "삼겹살 기름 묻은 종이 포장재", label: "pizza_box_greasy" },

    // 7. 깨진 유리 / 사기그릇 (broken_glass)
    { text: "바닥에 떨어져 깨진 유리컵 파편", label: "broken_glass" },
    { text: "금이 가고 깨진 사기그릇 도자기", label: "broken_glass" },
    { text: "깨진 전신 거울 유리 조각", label: "broken_glass" },
    { text: "깨진 뚝배기 도기 화분 조각", label: "broken_glass" },
    { text: "신문지에 싼 깨진 내열유리 냄비뚜껑", label: "broken_glass" },

    // 8. 깨끗한 유리병 (glass_bottle_clean)
    { text: "담배꽁초 없이 물로 헹군 소주병 맥주병", label: "glass_bottle_clean" },
    { text: "뚜껑 분리한 깨끗한 유리 잼병", label: "glass_bottle_clean" },
    { text: "깨지지 않은 투명 유리 음료수병", label: "glass_bottle_clean" },
    { text: "빈용기보증금 환급 마크 있는 갈색 맥주병", label: "glass_bottle_clean" },
    { text: "물로 씻은 와인병 유리병", label: "glass_bottle_clean" },

    // 9. 건전지 / 배터리 (battery)
    { text: "리모컨에서 뺀 다 쓴 AA AAA 알카라인 건전지", label: "battery" },
    { text: "부풀어 오른 스마트폰 보조배터리 리튬이온", label: "battery" },
    { text: "시계에 들어가는 동그란 수은전지 단추전지", label: "battery" },
    { text: "절연테이프 붙인 충전식 리튬 배터리", label: "battery" },

    // 10. 폐의약품 (medicine)
    { text: "유통기한 지난 감기약 처방약 알약 모음", label: "medicine" },
    { text: "먹다 남은 물약 어린이 해열제 시럽", label: "medicine" },
    { text: "사용 기한 지난 연고 및 안약", label: "medicine" },
    { text: "포장 뜯어서 알약만 모아둔 비닐봉투", label: "medicine" },

    // 11. 아이스팩 (젤 vs 친환경 물)
    { text: "미세플라스틱 젤 성분 들어있는 화학 아이스팩", label: "icepack_gel" },
    { text: "고흡수성 폴리머 젤 아이스팩 미개봉", label: "icepack_gel" },
    { text: "물 100% 가위로 잘라 물 버린 친환경 종이 아이스팩", label: "icepack_water" },
    { text: "순수 물만 들어있는 워터 아이스팩 비닐", label: "icepack_water" },

    // 12. 비닐류 (깨끗함 vs 오염됨)
    { text: "과자 가루 털어낸 깨끗한 과자 봉지 비닐", label: "vinyl_clean" },
    { text: "택배 완충재 에어캡 뽁뽁이 비닐", label: "vinyl_clean" },
    { text: "스티커 뗀 투명 빵 비닐봉지", label: "vinyl_clean" },
    { text: "이물질 없는 마트 검은 비닐봉투", label: "vinyl_clean" },
    { text: "기름 양념 묻어 끈적거리는 업소용 얇은 비닐랩", label: "vinyl_dirty" },
    { text: "음식물 찌꺼기 묻은 더러운 라면 봉지", label: "vinyl_dirty" },

    // 13. 캔 / 고철류 (can_metal)
    { text: "물로 헹궈 찌그러뜨린 알루미늄 콜라캔 사이다캔", label: "can_metal" },
    { text: "물로 씻은 참치캔 스팸 통조림 쇠캔", label: "can_metal" },
    { text: "야외에서 노즐 눌러 가스 다 뺀 부탄가스캔", label: "can_metal" },
    { text: "바닥에 구멍 뚫은 살충제 에프킬라 스프레이캔", label: "can_metal" },
    { text: "고철 프라이팬 냄비", label: "can_metal" },

    // 14. 종이팩 / 멸균팩 (paper_pack)
    { text: "물로 헹궈 가위로 펼쳐 말린 우유팩", label: "paper_pack" },
    { text: "빨대 떼고 씻어 말린 두유 멸균팩", label: "paper_pack" },
    { text: "펼쳐서 말린 1000ml 주스 종이팩", label: "paper_pack" },

    // 15. 스티로폼 (styrofoam_clean)
    { text: "택배 송장 테이프 다 뗀 깨끗한 흰색 스티로폼 상자", label: "styrofoam_clean" },
    { text: "얼룩이나 생선 비린내 없이 씻은 스티로폼 박스", label: "styrofoam_clean" },
    { text: "가전제품 포장용 순수 흰색 스티로폼 완충재", label: "styrofoam_clean" },

    // 16. 폐형광등 / 의류 / 소형가전
    { text: "깨지지 않은 긴 막대 폐형광등 삼파장 램프", label: "fluorescent_lamp" },
    { text: "깨끗하게 세탁한 안 입는 헌옷 셔츠 바지", label: "clothes_fabric" },
    { text: "고장 난 헤어드라이기 선풍기 소형 가전제품", label: "small_appliance" }
];
