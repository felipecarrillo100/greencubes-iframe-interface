import { BasicIconPainter } from "../utils/BasicIconPainter";
import { PainterAvailable } from "../../../../../src";

export class PainterFactory {
    public static getPainterByName(name?: string) {
        if (!name) return undefined;
        switch (name) {
            case PainterAvailable.Experience:
                return new BasicIconPainter();
        }
        return undefined;
    }
}
