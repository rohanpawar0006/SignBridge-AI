"""
SignBridge AI - Master Documentation and 360-Degree Interview Guide Generator
Builds:
  1. SignBridge_AI_Complete_Interview_Documentation.pdf
  2. INTERVIEW_QA_DOCUMENTATION.md
"""

import os
import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Add current scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))
from doc_content import PROJECT_METADATA, SYSTEM_SECTIONS, INTERVIEW_DOMAINS

# Palette
COLOR_PRIMARY = colors.HexColor("#0f172a")     # Deep Slate 900
COLOR_TEAL = colors.HexColor("#0f766e")        # Teal 700
COLOR_TEAL_LIGHT = colors.HexColor("#f0fdfa")  # Teal 50
COLOR_TEAL_BORDER = colors.HexColor("#99f6e4") # Teal 200
COLOR_INDIGO = colors.HexColor("#4338ca")      # Indigo 700
COLOR_INDIGO_LIGHT = colors.HexColor("#eef2ff")# Indigo 50
COLOR_AMBER = colors.HexColor("#b45309")       # Amber 700
COLOR_TEXT_MAIN = colors.HexColor("#1e293b")   # Slate 800
COLOR_TEXT_MUTED = colors.HexColor("#64748b")  # Slate 500
COLOR_BG_CARD = colors.HexColor("#f8fafc")     # Slate 50
COLOR_BORDER_CARD = colors.HexColor("#e2e8f0") # Slate 200
COLOR_BORDER_STRONG = colors.HexColor("#cbd5e1")# Slate 300
COLOR_WHITE = colors.HexColor("#ffffff")


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        if self._pageNumber == 1:
            self.saveState()
            self.setFillColor(COLOR_TEAL)
            self.rect(0, 0, 10, 792, fill=1, stroke=0)
            self.restoreState()
            return

        self.saveState()
        # Header
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(COLOR_TEAL)
        self.drawString(36, 758, "SIGNBRIDGE AI")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(104, 758, "|   Technical Project Architecture & 360-Degree Comprehensive Interview Bank")
        
        self.setStrokeColor(COLOR_BORDER_CARD)
        self.setLineWidth(0.6)
        self.line(36, 750, 576, 750)

        # Footer
        self.line(36, 38, 576, 38)
        self.setFont("Helvetica", 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(36, 26, "SignBridge AI - Duplex Real-Time ISL Communication Platform (Confidential / Technical Reference)")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 26, page_str)
        self.restoreState()


def get_custom_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        'CoverSuper',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=COLOR_INDIGO,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=COLOR_PRIMARY,
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=COLOR_TEAL,
        spaceAfter=12
    ))
    styles.add(ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=12,
        textColor=COLOR_TEXT_MUTED
    ))
    styles.add(ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=COLOR_PRIMARY,
        spaceBefore=7,
        spaceAfter=2,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        'DomainH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=COLOR_INDIGO,
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_TEXT_MAIN,
        spaceAfter=2.5
    ))
    styles.add(ParagraphStyle(
        'QTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.8,
        leading=12,
        textColor=COLOR_PRIMARY
    ))
    styles.add(ParagraphStyle(
        'QAnswer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_TEXT_MAIN
    ))
    styles.add(ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=COLOR_WHITE
    ))
    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.5,
        textColor=COLOR_TEXT_MAIN
    ))
    return styles


def build_card_box(title, badge, body_paragraphs, styles, width=540):
    content = []
    header_text = f"<font color='{COLOR_INDIGO.hexval()}'><b>[{badge}]</b></font>  <b>{title}</b>"
    content.append(Paragraph(header_text, styles['QTitle']))
    content.append(Spacer(1, 3))
    
    for p in body_paragraphs:
        content.append(Paragraph(p, styles['QAnswer']))
        content.append(Spacer(1, 2))

    card_table = Table([[content]], colWidths=[width])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 0.7, COLOR_BORDER_CARD),
        ('LINEBEFORE', (0, 0), (0, -1), 2.5, COLOR_TEAL),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]))
    return card_table


def generate_pdf(output_pdf_path: str):
    print(f"[PDF Generator] Creating PDF at: {output_pdf_path}")
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )
    styles = get_custom_styles()
    story = []

    # 1. Executive Title Block
    story.append(Spacer(1, 8))
    story.append(Paragraph("TECHNICAL DOCUMENTATION &amp; INTERVIEW ACCELERATOR", styles['CoverSuper']))
    story.append(Paragraph(PROJECT_METADATA["title"], styles['CoverTitle']))
    story.append(Paragraph(PROJECT_METADATA["subtitle"], styles['CoverSubtitle']))
    
    meta_box_text = (
        f"<b>Version:</b> {PROJECT_METADATA['version']} &nbsp;|&nbsp; "
        f"<b>Published:</b> {PROJECT_METADATA['date']} &nbsp;|&nbsp; "
        f"<b>Authored by:</b> {PROJECT_METADATA['authors']}<br/>"
        f"<b>Core Engineering Stack:</b> {PROJECT_METADATA['tech_stack']}"
    )
    
    meta_table = Table([[Paragraph(meta_box_text, styles['CoverMeta'])]], colWidths=[540])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_TEAL_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.8, COLOR_TEAL_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.2, color=COLOR_TEAL, spaceBefore=4, spaceAfter=8))

    # Architecture Overview Table
    arch_summary_data = [
        [
            Paragraph("Subsystem", styles['TableHeader']),
            Paragraph("Core Technologies", styles['TableHeader']),
            Paragraph("Execution Context", styles['TableHeader']),
            Paragraph("Key Responsibilities &amp; Capabilities", styles['TableHeader'])
        ],
        [
            Paragraph("<b>Edge CV Station</b>", styles['TableCell']),
            Paragraph("MediaPipe Hands, WebAssembly, Canvas 2D", styles['TableCell']),
            Paragraph("Client Browser (60 FPS)", styles['TableCell']),
            Paragraph("Extracts 21 3D landmarks, computes displacement velocity, segments motion intervals.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Cloud Inference</b>", styles['TableCell']),
            Paragraph("PyTorch Bi-LSTM, FastAPI, WebSockets", styles['TableCell']),
            Paragraph("Render Cloud (Python 3.11)", styles['TableCell']),
            Paragraph("Receives 30x63 windows, runs Bi-LSTM inference, evaluates heuristic fallback.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Spoken Station</b>", styles['TableCell']),
            Paragraph("Web Speech API, gTTS, islDictionary.js", styles['TableCell']),
            Paragraph("Bilingual (en-IN / hi-IN)", styles['TableCell']),
            Paragraph("Bilingual voice recognition, ISL gloss tokenization, sequenced studio video playback.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Duplex Engine</b>", styles['TableCell']),
            Paragraph("FIFO Audio Arbitration, React 19 State", styles['TableCell']),
            Paragraph("Shared Conversation", styles['TableCell']),
            Paragraph("2.2s auto-sentence boundary detection, transcript synchronization, audio queuing.", styles['TableCell'])
        ]
    ]
    arch_table = Table(arch_summary_data, colWidths=[80, 130, 90, 240])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLOR_WHITE, COLOR_BG_CARD]),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER_STRONG),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # PART 1: COMPLETE TECHNICAL DOCUMENTATION
    story.append(Paragraph("PART I: COMPLETE TECHNICAL PROJECT SPECIFICATIONS", styles['SectionH1']))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COLOR_BORDER_STRONG, spaceBefore=2, spaceAfter=6))

    for sec in SYSTEM_SECTIONS:
        story.append(Paragraph(sec["title"], styles['SectionH1']))
        for p in sec["content"]:
            story.append(Paragraph(p, styles['DocBody']))
        story.append(Spacer(1, 2))

    story.append(PageBreak())

    # PART 2: 360° INTERVIEW QUESTION & ANSWER BANK
    story.append(Paragraph("PART II: 360-DEGREE MASTER INTERVIEW QUESTION &amp; ANSWER BANK", styles['SectionH1']))
    story.append(Paragraph(
        "A rigorous, comprehensive interview preparation manual categorized into 11 engineering domains "
        "covering system architecture, computer vision, kinematics, PyTorch sequence modeling, frontend 60 FPS UX, "
        "bilingual NLP, concurrency, datasets, DevOps, and senior engineering trade-offs.",
        styles['DocBody']
    ))
    story.append(HRFlowable(width="100%", thickness=1.0, color=COLOR_INDIGO, spaceBefore=4, spaceAfter=8))

    for dom in INTERVIEW_DOMAINS:
        story.append(Paragraph(dom["domain"], styles['DomainH1']))
        story.append(Spacer(1, 3))
        
        for q in dom["questions"]:
            card = build_card_box(q["title"], dom["badge"], q["answer"], styles)
            story.append(card)
            story.append(Spacer(1, 6))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[PDF Generator] Successfully generated {output_pdf_path}!")


def generate_markdown(output_md_path: str):
    print(f"[Markdown Generator] Creating Markdown at: {output_md_path}")
    lines = []

    lines.append(f"# 🤟 {PROJECT_METADATA['title']} — Complete Technical Documentation & Interview Guide")
    lines.append(f"### *{PROJECT_METADATA['subtitle']}*")
    lines.append(f"**Version:** {PROJECT_METADATA['version']} | **Date:** {PROJECT_METADATA['date']} | **Authors:** {PROJECT_METADATA['authors']}")
    lines.append(f"**Core Stack:** `{PROJECT_METADATA['tech_stack']}`")
    lines.append("\n---\n")

    # Table of Contents
    lines.append("## 📑 Table of Contents")
    lines.append("### Part I: Complete Technical System Documentation")
    for sec in SYSTEM_SECTIONS:
        anchor = sec["title"].lower().replace(".", "").replace(" ", "-").replace("&", "").replace("/", "")
        lines.append(f"- [{sec['title']}](#{anchor})")
    lines.append("\n### Part II: 360° Interview Question & Answer Bank (45 Questions across 11 Domains)")
    for i, dom in enumerate(INTERVIEW_DOMAINS, 1):
        anchor = dom["domain"].lower().replace(":", "").replace(" ", "-").replace("&", "").replace(",", "")
        lines.append(f"- [{dom['domain']}](#{anchor}) ({len(dom['questions'])} Questions)")
    lines.append("\n---\n")

    # Part 1 Content
    lines.append("# Part I: Complete Technical System Documentation\n")
    for sec in SYSTEM_SECTIONS:
        lines.append(f"## {sec['title']}\n")
        for p in sec["content"]:
            # Clean formatting for markdown
            p_clean = p.replace("<b>", "**").replace("</b>", "**").replace("&nbsp;", " ")
            lines.append(f"{p_clean}\n")
        lines.append("\n")

    lines.append("---\n")

    # Part 2 Content
    lines.append("# Part II: 360° Master Interview Question & Answer Bank\n")
    for dom in INTERVIEW_DOMAINS:
        lines.append(f"## {dom['domain']}\n")
        for q in dom["questions"]:
            lines.append(f"### {q['title']}")
            lines.append(f"> **Domain Focus:** `{dom['badge']}`\n")
            for ans in q["answer"]:
                ans_clean = ans.replace("<b>", "**").replace("</b>", "**").replace("&nbsp;", " ")
                lines.append(f"{ans_clean}\n")
            lines.append("\n---\n")

    with open(output_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[Markdown Generator] Successfully generated {output_md_path}!")


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    pdf_dest = os.path.join(base_dir, "SignBridge_AI_Complete_Interview_Documentation.pdf")
    md_dest = os.path.join(base_dir, "INTERVIEW_QA_DOCUMENTATION.md")

    generate_pdf(pdf_dest)
    generate_markdown(md_dest)
