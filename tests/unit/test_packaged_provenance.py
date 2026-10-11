import tempfile
from pathlib import Path
import unittest
from inside_inference import provenance


class PackagedProvenanceTests(unittest.TestCase):
    def test_packaged_revision_is_explicit_and_missing_or_empty_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError): provenance.packaged_revision(Path(directory))
            path=Path(directory)/'build-revision.txt';path.write_text('')
            with self.assertRaises(ValueError): provenance.packaged_revision(Path(directory))
            path.write_text('known-build\n')
            self.assertEqual(provenance.packaged_revision(Path(directory)),'known-build')
