# 🥩 정육 도감 (Meat Cuts Guide)

한국식·서양식 **정육 방식으로 나눠 보는 소고기·돼지고기 부위 도감** 모바일 웹앱(PWA)입니다.

- 🐄 **소고기** — 한국식 **대분할 10 · 소분할 39** / 서양식 US Primal 9부위
- 🐖 **돼지고기** — 한국식 **대분할 7 · 소분할 25** / 서양식 Primal 7부위
- 📄 **총 97개 부위 상세 페이지**
- 🗺️ **인터랙티브 SVG 도해** — **대분할 ↔ 소분할 전환**, 부위를 터치하면 상세 페이지로. 상세 페이지에는 해당 부위만 하이라이트된 도해가 자동으로 그 위치까지 스크롤됩니다
- 🍳 **부위별 어울리는 조리법** — 구이·스테이크·삶기(수육)·국물·찜·볶음·튀김·회·전골·다짐육 (적합도 ★1~5 + 실전 팁)
- 🔪 **통고기(덩어리) 손질법** — 부위별 도구 / 단계별 순서 / 수율 / 보관법
- 🔍 **품질·선도 판별법** — 부위마다 "좋은 것 고르는 법"과 "피해야 할 것"
- 🏷️ **등급 체계** — 한우 육질·육량 등급, 돼지 등급(PSE/DFD 포함), USDA Prime/Choice/Select, 숙성 표기
- 🌡️ **조리 내부온도표**, 보관·해동 가이드
- 🔎 **검색** (부위·요리·조리법) 및 **조리법 역검색**
- 📱 PWA — 홈 화면에 설치 가능, 오프라인 동작, 라이트/다크 모드 자동

---

## 📁 파일 구성

```
meat-guide/
├── index.html            앱 진입점
├── manifest.json         PWA 매니페스트
├── sw.js                 서비스 워커 (오프라인 캐시)
├── .nojekyll             GitHub Pages에서 Jekyll 처리 비활성화
├── css/
│   └── style.css
├── js/
│   ├── data-beef.js      소고기 대분할 데이터 (한국식 + 서양식)
│   ├── data-pork.js      돼지고기 대분할 데이터 (한국식 + 서양식)
│   ├── data-sub-beef.js  소고기 소분할 39부위 데이터
│   ├── data-sub-pork.js  돼지고기 소분할 25부위 데이터
│   ├── data-prep.js      통고기 손질법 데이터
│   ├── data-guide.js     등급·선도·보관·온도 데이터
│   └── app.js            라우터 · SVG 도해 렌더러 · 화면 구성
├── icons/                앱 아이콘 (32 / 180 / 192 / 512 / 1024 + maskable, 배경 투명 PNG)
├── build-preview.py      단일 파일(preview.html) 생성 스크립트
└── preview.html          모든 리소스를 인라인한 단일 파일 버전
```

빌드 도구, npm 설치, 번들러가 **전혀 필요 없습니다.** 순수 HTML/CSS/JS입니다.

---

## 🚀 GitHub에 올려서 배포하기

### 방법 A — 웹에서 드래그 앤 드롭 (가장 쉬움)

1. GitHub에서 **New repository** → 이름 입력(예: `meat-guide`) → **Public** 선택 → Create
2. 생성된 저장소 화면에서 **Add file ▸ Upload files** 클릭
3. 압축을 푼 폴더 **안의 내용물 전체**를 드래그해서 올립니다
   - ⚠️ `meat-guide` 폴더 자체가 아니라 **그 안의 `index.html`, `css/`, `js/`, `icons/` …** 를 올려야 합니다
   - ⚠️ `.nojekyll` 파일은 숨김 파일이라 안 보일 수 있습니다. 안 보이면 GitHub에서 **Add file ▸ Create new file** → 파일명에 `.nojekyll` 입력 → 내용 비운 채 Commit
4. **Commit changes** 클릭
5. **Settings ▸ Pages** 이동
6. *Source* 를 **Deploy from a branch**, *Branch* 를 **main / (root)** 으로 지정 → **Save**
7. 1~2분 뒤 아래 주소로 접속됩니다

```
https://<본인_깃허브_아이디>.github.io/meat-guide/
```

### 방법 B — Git 명령어

```bash
cd meat-guide
git init
git add .
git commit -m "정육 도감 앱 초기 커밋"
git branch -M main
git remote add origin https://github.com/<아이디>/meat-guide.git
git push -u origin main
```

푸시 후 **Settings ▸ Pages** 에서 위 6번과 동일하게 설정합니다.

---

## 📲 휴대폰에 앱처럼 설치하기

GitHub Pages 주소로 접속한 뒤:

- **iPhone (Safari)** — 공유 버튼 <kbd>↑</kbd> ▸ **홈 화면에 추가**
- **Android (Chrome)** — 우측 상단 ⋮ ▸ **앱 설치** 또는 **홈 화면에 추가**

설치하면 주소창 없는 전체화면으로 실행되고, 서비스 워커 덕분에 **비행기 모드에서도 동작**합니다.

> 참고: 서비스 워커는 `https://` 또는 `localhost` 에서만 동작합니다. 파일을 더블클릭해서 여는 `file://` 방식에서는 오프라인 캐시가 작동하지 않지만, 앱 기능은 모두 정상입니다.

---

## 💻 로컬에서 실행

```bash
cd meat-guide
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

또는 `preview.html` 파일을 브라우저로 바로 열어도 됩니다 (단일 파일 버전).

---

## 🛠️ 내용 수정하기

모든 콘텐츠가 데이터 파일에 분리되어 있어 **JS를 몰라도 텍스트만 고치면 됩니다.**

| 고치고 싶은 것 | 파일 |
|---|---|
| 소고기 대분할 설명·조리법·품질 팁 | `js/data-beef.js` |
| 돼지고기 대분할 설명·조리법·품질 팁 | `js/data-pork.js` |
| 소고기 소분할 39부위 | `js/data-sub-beef.js` |
| 돼지고기 소분할 25부위 | `js/data-sub-pork.js` |
| 통고기 손질 단계·보관법 | `js/data-prep.js` |
| 등급표·선도 체크리스트·온도표 | `js/data-guide.js` |
| 도해 그림(부위 경계 좌표) | 대분할 = `shape`, 소분할 = `rect: [x,y,w,h]`, 동물 실루엣 = `deco` |
| 색상·글꼴·레이아웃 | `css/style.css` |

부위 하나의 데이터 구조:

```js
{
  id: 'kr-ansim',              // 고유 ID (kr- 한국식 / ws- 서양식)
  name: '안심', en: 'Tenderloin',
  tags: ['최고급', '초저지방'],
  shape: '480,246 590,246 …',   // SVG 폴리곤 좌표 (도해 위치)
  pos: '위치 설명',
  feature: '부위 특징',
  stats: { tender:5, fat:1, flavor:3, price:5 },   // 각 1~5
  sub: [{ ko:'안심살', en:'Tenderloin', note:'…' }],
  cook: [{ m:'스테이크', s:5, tip:'…' }],           // s = 적합도 1~5
  dishes: ['안심 스테이크', '샤토브리앙'],
  quality: ['좋은 것 고르는 법 …'],
  avoid: ['피해야 할 것 …'],
  xref: { key:'ws-shortloin', label:'Short Loin' }  // 반대 방식 대응 부위
}
```

수정 후 단일 파일 미리보기를 다시 만들려면:

```bash
python3 build-preview.py
```

캐시 때문에 수정이 반영되지 않으면 `sw.js` 첫 줄의 `meat-guide-v3` 을 `v4`, `v5` … 으로 올려주세요.

소분할 도해는 `viewBox 0 0 1000 620` 좌표계 위에 사각형(`rect`)을 깔고 **동물 실루엣(`deco.body`)으로 clipPath 클리핑**하는 구조입니다. 사각형이 실루엣 밖으로 조금 넘쳐도 자동으로 잘리므로, 좌표를 정확히 맞출 필요 없이 대략만 맞추면 됩니다.

---

## ⚠️ 참고

- 부위 명칭과 분할 기준은 **축산물 표준 분할·분할육 기준(한국)** 및 북미 프라이멀 관행을 바탕으로 정리했습니다. 지역·정육점에 따라 명칭과 경계가 다를 수 있습니다.
- **도해는 위치 이해를 위한 모식도**로, 실제 해부학적 경계와 차이가 있습니다.
- 등급 기준과 안전 조리 온도는 관련 기관 고시가 개정될 수 있으므로, 실제 구매·조리 시 축산물품질평가원(한국) 및 USDA(미국)의 최신 기준을 함께 확인하세요.
- 생식(육회 등)은 위생 관리된 신선육에 한하며, 면역 저하자·임산부·영유아·고령자에게는 권장되지 않습니다.

---

## 📄 라이선스

개인·학습 용도로 자유롭게 사용·수정하세요.
