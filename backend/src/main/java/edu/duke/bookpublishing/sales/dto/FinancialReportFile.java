package edu.duke.bookpublishing.sales.dto;

public record FinancialReportFile(String filename, String contentType, byte[] content) {}
