# jusiksuvive.com 배포 가이드

이 폴더의 파일(`index.html`, `game.js`, `styles.css`)을 정적 호스팅에 올리면 됩니다.

## 1. GitHub Pages

1. GitHub 저장소에 파일 업로드
2. **Settings → Pages → Source**: `main` 브랜치, `/ (root)`
3. **Custom domain**: `jusiksuvive.com` 입력
4. 저장소 루트의 `CNAME` 파일이 이미 `jusiksuvive.com` 으로 설정되어 있음

### DNS (도메인 등록업체)

| 타입 | 이름 | 값 |
|------|------|-----|
| A | `@` | `185.199.108.153` (및 `.109`, `.110`, `.111`) |
| CNAME | `www` | `<사용자명>.github.io` |

또는 GitHub Pages 안내에 나온 4개의 A 레코드를 사용하세요.

## 2. Vercel

1. [vercel.com](https://vercel.com)에서 이 폴더 Import
2. **Domains**에 `jusiksuvive.com`, `www.jusiksuvive.com` 추가
3. Vercel이 안내하는 DNS 레코드를 도메인에 설정

## 3. Netlify

1. [netlify.com](https://netlify.com)에 폴더 드래그 앤 드롭 또는 Git 연결
2. **Domain management**에서 `jusiksuvive.com` 연결
3. Netlify DNS 또는 외부 DNS에 CNAME 설정

---

배포 후 `https://jusiksuvive.com` 에서 게임이 열리면 완료입니다.
