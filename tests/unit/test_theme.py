"""Style authority is checked without building a website."""
from pathlib import Path
import tempfile
import unittest
from scripts.build.theme import check_theme, split


class ThemeTests(unittest.TestCase):
    def test_repository_has_one_appearance_authority(self):
        check_theme(Path(__file__).resolve().parents[2])

    def test_layout_and_nested_theme_rules_are_separated(self):
        paint,layout=split('@media(max-width:500px){button{color:red;display:flex;padding:4px}}')
        self.assertIn('color:red',paint)
        self.assertNotIn('color',layout)
        self.assertIn('display:flex',layout)
        self.assertIn('padding:4px',layout)

    def test_competing_appearance_and_inline_paint_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);web=root/'web';web.mkdir()
            (web/'theme.css').write_text('button{color:red}')
            page=web/'page.css';page.write_text('button{display:flex}')
            check_theme(root)
            for style in ('button{color:blue}','button{COLOR:blue}','button{filter:grayscale(1)}'):
                page.write_text(style)
                with self.assertRaisesRegex(ValueError,'theme.css'):check_theme(root)
            page.write_text('button{display:flex}')
            (web/'page.js').write_text("button.style.backgroundColor='blue'")
            with self.assertRaisesRegex(ValueError,'custom property'):check_theme(root)
