@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DiagramWeave 更新

echo(
echo DiagramWeave - 从 Git 仓库拉取最新版本...
echo(

where git >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Git。若你是 ZIP 下载用户，请到 GitHub Releases 手动下载新版本覆盖。
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [错误] 当前目录不是 Git 仓库。请从 GitHub 下载 Release 包，或使用 git clone 获取项目。
  pause
  exit /b 1
)

git pull --ff-only
if errorlevel 1 (
  echo [错误] git pull 失败。若有本地修改，请先备份再处理冲突。
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [警告] 未检测到 Node.js，跳过依赖同步。
  pause
  exit /b 0
)

node "%~dp0scripts\setup.mjs"
if errorlevel 1 (
  pause
  exit /b 1
)

echo(
echo 更新完成。请重新双击「启动DiagramWeave.bat」运行。
echo(
pause
