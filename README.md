# 마음지도 MVP

느끼고 싶은 감정으로 장소와 경험을 발견하는 반응형 지도 SNS입니다. 모든 자체 구성요소는 Docker 컨테이너로 실행하며, 데이터와 사진은 로컬 Docker 볼륨에 저장합니다.

## 실행

```bash
cp .env.example .env
docker compose up --build
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다. 외부 API 키가 비어 있으면 목업 지도, 데모 장소 검색, 데모 로그인으로 전체 흐름을 확인할 수 있습니다.

현재 Docker Compose 버전에서 의존 서비스 시작이 오래 걸리면 다음처럼 순서대로 실행할 수 있습니다.

```bash
docker compose up -d db
docker compose run --rm migrate
docker compose up -d web
```

## 실제 연동

`.env`에 다음 값을 설정합니다.

- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`: Auth.js 카카오 Provider
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`: 네이버 지도 JavaScript API
- `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET`: 네이버 지역 검색 API
- `NEXTAUTH_SECRET`: 운영 환경용 긴 무작위 문자열

카카오 개발자 콘솔의 Redirect URI에는 `http://localhost:3000/api/auth/callback/kakao`를 등록합니다. 운영 환경에서는 실제 도메인으로 바꿉니다. 실제 카카오 로그인만 허용하려면 `DEMO_AUTH=false`로 설정합니다.

## 검증

```bash
docker compose --profile test run --rm test
docker compose run --rm web yarn tsc --noEmit
docker compose run --rm web yarn lint
docker compose run --rm web yarn build
```

## 주요 구조

- `pages/index.tsx`: 반응형 지도 탐색
- `pages/experiences`: 경험 작성·상세
- `pages/me.tsx`: 내 기록과 공감 기록
- `pages/api`: 인증, 지도, 경험, 반응, 신고, 사진 API
- `prisma`: Prisma 스키마, PostGIS 마이그레이션, 데모 시드
- `storage`: 개발용 사진 저장 위치이며 실제 실행에서는 Docker 볼륨을 사용

공개 지도 API는 흐리게 변환된 좌표만 반환합니다. 정확한 좌표는 본인이 자신의 기록을 조회할 때만 응답에 포함됩니다.
