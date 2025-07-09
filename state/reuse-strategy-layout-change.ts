import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';

export class ReuseStrategyLayoutChange {

  public static evaluateSnapinsToReuse(
    currentFrameId: string,
    currentSnapinsPerPane: Map<string, { snapinId: string; handled: boolean }>,
    futurePanesPerSnapin: Map<string, { paneId: string; occupied: boolean }[]>): FullSnapInId[] {

    // Important: The method handles layout changes within frames only!
    // Intentionally, as frame switches must have a different reuse strategy.

    const snapinsToReuse: FullSnapInId[] = [];
    // we iterate twice intentionally! In first iteration we handle only full matches of pane names as this has priority!
    currentSnapinsPerPane.forEach((snapin, paneId) => {
      if (futurePanesPerSnapin.has(snapin.snapinId)) {
        const futurePanes1: { paneId: string; occupied: boolean }[] = futurePanesPerSnapin.get(snapin.snapinId)!;
        // the same snapin type is in multiple future panes.
        // search for matching pane names first:
        const foundPane: { paneId: string; occupied: boolean } | undefined = futurePanes1.find(futPane => (futPane.paneId === paneId));
        if (foundPane !== undefined) {
          if (foundPane.occupied === false) {
            snapinsToReuse.push(new FullSnapInId(currentFrameId, snapin.snapinId));
            foundPane.occupied = true;
            snapin.handled = true;
          }
        }
      }
    });
    // second iteration:
    currentSnapinsPerPane.forEach((snapin, _paneId) => {
      if (snapin.handled === false) {
        if (futurePanesPerSnapin.has(snapin.snapinId)) {
          const futurePanes2: { paneId: string; occupied: boolean }[] = futurePanesPerSnapin.get(snapin.snapinId)!;
          for (const pane of futurePanes2) {
            if (pane.occupied === false) {
              snapinsToReuse.push(new FullSnapInId(currentFrameId, snapin.snapinId));
              pane.occupied = true;
              snapin.handled = true;
              break;
            }
          }

        }
      }
    });
    return snapinsToReuse;
  }
}
