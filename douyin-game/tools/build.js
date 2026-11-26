/* 把小游戏需要的引擎与素材从仓库根目录同步到 douyin-game/
   小游戏只能打包项目目录内的文件，所以 js/ 与 assets/ 需要复制一份。 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const dest = path.resolve(__dirname, '..');

function copyDir(src, out) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(out, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(out, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(path.join(repoRoot, 'js'), path.join(dest, 'engine'));
copyDir(path.join(repoRoot, 'assets'), path.join(dest, 'assets'));

console.log('[build] 已同步 js/ -> douyin-game/engine, assets/ -> douyin-game/assets');
