import { test, expect } from "@playwright/test";

test("실제 Oracle: 로그인, 한글 CRUD, 검색, 모바일, 로그아웃", async ({
  page,
}) => {
  const password = process.env.E2E_PASSWORD;
  test.skip(
    !password,
    "E2E_PASSWORD 환경변수가 있어야 실제 DB 통합 검증을 실행합니다.",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "다시 만나 반가워요" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
  });
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("deliberately-wrong-password");
  await page.getByRole("button", { name: "워크스페이스 들어가기" }).click();
  await expect(page.getByRole("alert")).toContainText("아이디 또는 비밀번호");
  await page.getByLabel("비밀번호", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "워크스페이스 들어가기" }).click();
  await expect(
    page.getByRole("heading", { name: "생각을 나누는 공간." }),
  ).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/board-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "생각을 나누는 공간." }),
  ).toBeVisible();
  const title = `자동검증 한글 기록 ${Date.now()}`;
  let postId: number | undefined;
  try {
    await page.getByRole("button", { name: "새 글 작성" }).click();
    await page.getByLabel("제목", { exact: false }).last().fill(title);
    await page
      .getByLabel("내용", { exact: false })
      .fill(
        "안녕하세요. Oracle에 저장되는 한글 내용입니다.\n두 번째 줄도 유지합니다.",
      );
    const created = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/posts") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "게시글 등록" }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    postId = (await response.json()).id;
    await expect(page.locator(".post-content")).toContainText(
      "두 번째 줄도 유지합니다.",
    );
    await page.getByRole("button", { name: "수정하기" }).click();
    await page
      .getByLabel("제목", { exact: false })
      .last()
      .fill(`${title} 수정`);
    await page
      .getByLabel("내용", { exact: false })
      .fill("수정 완료: 한글 및 emoji 🌱 확인");
    await page.getByRole("button", { name: "수정 완료", exact: true }).click();
    await expect(page.locator(".post-content")).toHaveText(
      "수정 완료: 한글 및 emoji 🌱 확인",
    );
    await page.screenshot({
      path: "test-results/post-detail.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "목록으로" }).click();
    await page.getByRole("textbox", { name: "게시글 검색" }).fill(title);
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await page
      .getByRole("button", { name: `${title} 수정`, exact: true })
      .click();
    await expect(page.locator(".post-content")).toHaveText(
      "수정 완료: 한글 및 emoji 🌱 확인",
    );
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page.getByText("이 게시글을 삭제할까요?")).toBeVisible();
    await page.getByRole("button", { name: "삭제 확인" }).click();
    await expect(
      page.getByRole("heading", { name: "검색 결과가 없습니다" }),
    ).toBeVisible();
    postId = undefined;
    await page.getByRole("button", { name: "검색 초기화" }).click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "test-results/board-mobile.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.getByRole("button", { name: "이용 가이드" }).last().click();
    await expect(
      page.getByRole("heading", { name: "기록의 시작, 모아 이용 가이드." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(
      page.getByRole("heading", { name: "다시 만나 반가워요" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    if (postId) {
      const token = await (await page.request.get("/api/auth/csrf")).json();
      const cleanup = await page.request.delete(`/api/posts/${postId}`, {
        headers: { [token.headerName]: token.token },
      });
      expect([204, 404]).toContain(cleanup.status());
    }
  }
});
