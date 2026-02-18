/**
 * Copies text to the clipboard with a fallback for non-secure contexts.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    // Try modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Modern clipboard API failed, trying fallback...', err);
        }
    }

    // Fallback: Use a hidden textarea
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Copy fallback failed', err);
        return false;
    }
};
