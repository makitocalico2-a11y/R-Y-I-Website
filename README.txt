R-Y-I ホームページ モックアップ v2.2

■ 主な変更
- トップ初回表示に軽量イントロアニメーションを追加
- ボタン・カードのホバー／押下フィードバックを強化
- スクロール表示に段階的なアニメーションを追加
- パララックス処理を requestAnimationFrame で軽量化
- prefers-reduced-motion に対応
- 画像を PNG から WebP に変換し大幅に軽量化
- お問い合わせフォームは表示確認用で実送信しません

■ 確認方法
index.html をブラウザで開いてください。


[v2.3]
Internal page links now use a lightweight ~260ms fade/slide transition before navigation, with a ~380ms entrance settle. The homepage intro appears only once per browser tab/session.
