"""
SignBridge AI - Master Documentation and 360-Degree Interview Guide Generator
Produces:
  1. SignBridge_AI_Complete_Interview_Documentation.pdf (Executive styled publication PDF)
  2. INTERVIEW_QA_DOCUMENTATION.md (Full Markdown reference)
"""

import os
import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

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
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLOR_TEAL)
        self.drawString(36, 758, "SIGNBRIDGE AI")
        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(108, 758, "|   Technical Project Architecture & 360° Comprehensive Interview Bank")
        
        self.setStrokeColor(COLOR_BORDER_CARD)
        self.setLineWidth(0.6)
        self.line(36, 750, 576, 750)

        # Footer
        self.line(36, 38, 576, 38)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(36, 26, "SignBridge AI — Duplex Real-Time ISL Communication Platform (Confidential / Technical Reference)")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 26, page_str)
        self.restoreState()


def create_styles():
    styles = getSampleStyleSheet()
    
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
        fontSize=8.5,
        leading=12,
        textColor=COLOR_TEXT_MUTED
    ))
    styles.add(ParagraphStyle(
        'DocH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=COLOR_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        'DocH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=COLOR_TEAL,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=COLOR_TEXT_MAIN,
        spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.5,
        textColor=COLOR_TEXT_MAIN,
        leftIndent=12,
        spaceAfter=3
    ))
    styles.add(ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=COLOR_PRIMARY,
        leftIndent=6
    ))
    styles.add(ParagraphStyle(
        'QBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=COLOR_INDIGO
    ))
    styles.add(ParagraphStyle(
        'QTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=COLOR_PRIMARY
    ))
    styles.add(ParagraphStyle(
        'QAnswer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.5,
        textColor=COLOR_TEXT_MAIN
    ))
    styles.add(ParagraphStyle(
        'QBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_TEXT_MAIN,
        leftIndent=10,
        spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=COLOR_WHITE
    ))
    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10,
        textColor=COLOR_TEXT_MAIN
    ))
    return styles


def build_card_box(title, badge, body_paragraphs, styles, width=540):
    """
    Renders an interview Q&A or technical deep-dive card with clean borders,
    accent banner, and structured response.
    """
    content = []
    # Header block
    header_text = f"<font color='{COLOR_INDIGO.hexval()}'><b>[{badge}]</b></font>  <b>{title}</b>"
    content.append(Paragraph(header_text, styles['QTitle']))
    content.append(Spacer(1, 4))
    
    # Body
    for p in body_paragraphs:
        if isinstance(p, str):
            content.append(Paragraph(p, styles['QAnswer']))
            content.append(Spacer(1, 2))
        else:
            content.append(p)
            content.append(Spacer(1, 2))

    card_table = Table([[content]], colWidths=[width])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 0.8, COLOR_BORDER_CARD),
        ('LINEBEFORE', (0, 0), (0, -1), 3.0, COLOR_TEAL),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return card_table


print("Styles and card builder initialized.")
