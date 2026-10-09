# Skill của dự án Pixel Shipper

- [Playwright](playwright/SKILL.md): kiểm thử trình duyệt, thao tác UI và chụp ảnh xác minh.
- [Phaser 3](../.agents/skills/phaser3-game-dev/SKILL.md): scene, vật lý, camera và HUD.
- [Procedural pixel art](../.agents/skills/procedural-pixel-art/SKILL.md): tạo texture pixel art bằng canvas.
- [Web Audio](../.agents/skills/web-audio-game-synth/SKILL.md): âm thanh và nhạc tổng hợp.

Playwright được cài từ kho chính thức `openai/skills` và đặt trực tiếp trong thư mục dự án. Hướng dẫn sử dụng/kiểm tra phụ thuộc nằm trong SKILL.md của từng skill.

Trên Windows/PowerShell, từ thư mục dự án:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=pixel-shipper open http://127.0.0.1:5188/ --config=skill/playwright/cli.config.json
npx --yes --package @playwright/cli playwright-cli -s=pixel-shipper snapshot
```

Cấu hình dùng Chrome có sẵn, phiên kiểm thử riêng và lưu ảnh/snapshot trong `output/playwright/`.
