import { test, expect } from '@playwright/test';

test('Oracle login, Korean CRUD, search, mobile layout and logout', async ({ page }) => {
  const password = process.env.E2E_PASSWORD;
  if (!password) throw new Error('Set E2E_PASSWORD to the provided guest01 password.');
  const marker = `검증 기록 ${Date.now()}`;
  let createdId: number | undefined;
  const pageErrors: string[] = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '다시 만나 반가워요' })).toBeVisible();
  await page.screenshot({ path: '../.local/login-desktop.png', fullPage: true });
  await page.getByLabel('비밀번호', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('아이디 또는 비밀번호');
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '함께 쌓는 기록.' })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await page.screenshot({ path: '../.local/board-desktop.png', fullPage: true });
  const baseline = await page.request.get('/api/posts').then(r => r.json());
  try {
    await page.getByRole('button', { name: '새 게시글', exact: true }).click();
    await page.getByLabel('제목', { exact: false }).fill(marker);
    await page.getByLabel('내용', { exact: false }).fill('한글 UTF-8 저장 확인\n두 번째 줄과 이모지 🙂');
    const created = page.waitForResponse(r => r.url().endsWith('/api/posts') && r.request().method() === 'POST');
    await page.getByRole('button', { name: '게시글 등록' }).click();
    const response = await created; expect(response.status()).toBe(201); createdId = (await response.json()).id;
    await expect(page.locator('.toast')).toContainText('저장되었습니다');
    await page.getByRole('textbox', { name: '게시글 검색' }).fill(marker);
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await page.locator('.post-title').filter({ hasText: marker }).click();
    await expect(page.locator('.detail-content')).toContainText('한글 UTF-8 저장 확인');
    await page.getByRole('button', { name: '수정', exact: true }).click();
    await page.getByLabel('제목', { exact: false }).fill(`${marker} 수정`);
    await page.getByLabel('내용', { exact: false }).fill('수정된 한글 내용\n' + '긴 본문 검증 '.repeat(800));
    await page.getByRole('button', { name: '수정 저장' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.locator('.post-title').filter({ hasText: `${marker} 수정` }).click();
    await expect(page.locator('.detail-content')).toContainText('수정된 한글 내용');
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await page.getByRole('button', { name: '삭제하기', exact: true }).click();
    await expect(page.getByRole('heading', { name: '검색 결과가 없습니다' })).toBeVisible();
    createdId = undefined;
    await page.getByRole('button', { name: '전체 보기', exact: true }).click();
    await expect(page.locator('tbody tr').first()).toBeVisible();
    if (baseline.totalElements > 8) {
      await page.getByRole('button', { name: '다음 페이지' }).click();
      await expect(page.locator('[aria-current="page"]')).toHaveText('2');
    }
    await page.reload();
    await expect(page.getByRole('heading', { name: '함께 쌓는 기록.' })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await page.screenshot({ path: '../.local/board-mobile.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    expect(pageErrors).toEqual([]);
    expect((await page.request.get('/api/posts').then(r => r.json())).totalPosts).toBe(baseline.totalPosts);
  } finally {
    if (createdId) {
      const token = await page.request.get('/api/auth/csrf').then(r => r.json());
      await page.request.delete(`/api/posts/${createdId}`, { headers: { [token.headerName]: token.token } });
    }
  }
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('heading', { name: '다시 만나 반가워요' })).toBeVisible();
  expect((await page.request.get('/api/posts')).status()).toBe(401);
});
