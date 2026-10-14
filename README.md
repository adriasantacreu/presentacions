# Presentacions interactives

Presentacions de classe en HTML amb l'estètica del tema `adria` (Beamer): resultats que es revelen amb ▶, ginys per experimentar, generador d'exercicis amb comprovació i mode lectura. Un sol fitxer autònom per presentació, funciona sense internet.

Web: https://adriasantacreu.github.io/presentacions/

| Carpeta | Què hi ha |
|---|---|
| `src/<curs>/` | Fonts de cada presentació (HTML amb `$…$` i classes del tema) |
| `eines/` | Motor (`deck.js`, `deck.css`) i empaquetador (`build.py`) |
| `<curs>/` | Presentacions publicades (versió per a l'alumnat, sense diapos de solucions de les pauses) |

Construir (cal `npm install` a `eines/` i Python amb `fontTools`):

```bash
python eines/build.py src/1bat/polinomis.html 1bat/polinomis.html --alumnes
```
