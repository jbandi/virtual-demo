import {useState, useRef, useEffect} from 'react'
import {faker} from '@faker-js/faker'
import './App.css'
import spinner from './assets/refresh-cw.svg'

import {useVirtualizer} from '@tanstack/react-virtual'

type Item = {
    id: string;
    data: string;
}
// Mocked backend data
let allItems: Item[] = Array.from(Array(50).keys()).map((i) => ({
    id: crypto.randomUUID(),
    data: `Data ${i} - ${faker.internet.userName()}`
}));

// Mocking changes in the backend
function addItemInBackend() {
    allItems = [{
        id: crypto.randomUUID(),
        data: `Data ${allItems.length} - - ${faker.internet.email()}`
    }, ...allItems];
}

function fetchItemSlice(itemId: string) {
    // Simulate a backend fetch
    // Assumption: we can fetch a slice of items around a given item id

    const itemIndex = allItems.findIndex((item) => item.id === itemId);
    const lowerBound = Math.max(0, itemIndex - 10);
    const upperBound = lowerBound + 20;
    const itemSlice = allItems.slice(lowerBound, upperBound);
    const fetchresponse = {itemSlice, itemCount: allItems.length, offset2: Math.max(0, itemIndex - 10)};
    console.log(`Fetching data slice for ${itemId} `, fetchresponse);


    return new Promise<{ itemSlice: Item[], itemCount, offset2: number }>((resolve) => {
        setTimeout(() => {
            resolve(fetchresponse);
        }, 300);
    });
}

function App() {
    return (
        <AppContent/>
    );
}

function AppContent() {
    const [loading, setLoading] = useState(false);
    const [fetchedItems, setFetchedItems] = useState<Item[]>([]);
    const [itemCount, setItemCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const parentRef = useRef()

    async function fetchItemsFromBackend() {
        setLoading(true);
        const centerId = renderedItems[Math.floor(renderedItems.length / 2)]?.id;
        const {itemSlice, offset2, itemCount} = await fetchItemSlice(centerId);
        setOffset(offset2);
        setItemCount(itemCount);
        console.log('FETCHED SLICE', offset, centerId)
        setFetchedItems(itemSlice)
        setLoading(false)
    }

    const rowVirtualizer = useVirtualizer({
        count: itemCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 90,
        overscan: 0,
        // initialOffset: 10
        onChange: async (virtualItems) => {
            // We could fetch on scroll, so we would see changes in the backend immediately
            // not only when we fetch a new slice into the client
            // ... but this would have to be investigated to prevent too many requests ...
            // await fetchItemsFromBackend();
        }
    });

    const renderedItems = rowVirtualizer.getVirtualItems().map((virtualItem) => {
        return fetchedItems[virtualItem.index - offset];
    });

    useEffect(() => {
        (async () => {
            if (renderedItems.at(0)
                && fetchedItems.indexOf(renderedItems.at(0)) >= fetchedItems.length - renderedItems.length) {
                console.log('UPPER BOUND REACHED', renderedItems.filter(i => i)?.at(-1)?.id, fetchedItems.indexOf(renderedItems.filter(i => i)?.at(-1)), renderedItems.filter(i => i).length - 1, renderedItems);
                await fetchItemsFromBackend();
            } else if ((renderedItems.length > 0)
                && renderedItems.filter(i => i)?.at(-1)
                && ((fetchedItems.indexOf(renderedItems.filter(i => i)?.at(-1)) ?? 0) <= (renderedItems.filter(i => i).length - 1))
                && rowVirtualizer.getVirtualItems().at(0).index > 0) {
                console.log('LOWER BOUND REACHED', renderedItems.filter(i => i)?.at(-1)?.id, fetchedItems.indexOf(renderedItems.filter(i => i)?.at(-1)), renderedItems.filter(i => i).length - 1, renderedItems);
                await fetchItemsFromBackend();
            } else if (fetchedItems.length === 0) {
                // Fetching initial items
                setLoading(true);
                const {itemSlice, itemCount, offset2} = await fetchItemSlice(undefined);
                setFetchedItems(itemSlice)
                setItemCount(itemCount);
                setOffset(offset2);
                setLoading(false)
            }
        })();
    }, [
        renderedItems,
        fetchedItems
    ]);


    return (
        <div style={{maxWidth: 1000, minWidth: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                <div style={{margin: "auto"}}>
                    <div style={{display: "flex", flexDirection: "row", width: 800, alignItems: "center"}}>
                        <h1>Demo</h1>
                        {loading &&
                            <img src={spinner}
                                 style={{marginLeft: 20, animation: "logo-spin infinite 1s linear"}}/>}
                        <div style={{marginLeft: "auto"}}>
                            <button onClick={addItemInBackend}>Add Item in Backend</button>
                        </div>
                    </div>
                    <div style={{border: "solid 1px black", padding: 5}}>
                        {fetchedItems.length === 0
                            ? <div>Loading...</div>
                            : <div
                                ref={parentRef}
                                style={{
                                    height: `400px`,
                                    overflow: 'auto', // Make it scroll!
                                }}
                            >
                                <div
                                    style={{
                                        height: `${rowVirtualizer.getTotalSize()}px`,
                                        width: '100%',
                                        position: 'relative',
                                    }}
                                >
                                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {

                                        const item = fetchedItems[virtualItem.index - offset];
                                        return (
                                            <div
                                                key={virtualItem.key}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${virtualItem.size}px`,
                                                    transform: `translateY(${virtualItem.start}px)`,
                                                }}
                                            >
                                                <RowItem index={virtualItem.index} data={item?.data}/>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
            <hr/>

            {fetchedItems.length > 0 &&
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    fontSize: "x-small"
                }}>
                    <div>
                        <h3>Debug: Rendered Items </h3>
                        <div>
                            {
                                renderedItems.map((item) => {
                                    return (
                                        <div key={item?.id}>
                                            {/*{item.id}*/}
                                            {item?.data}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div>
                        <h3>Debug: Client Fetched Items, Offset {offset}</h3>
                        <div>
                            {
                                fetchedItems.map((item) => {
                                    return (
                                        <div key={item?.id}
                                             style={{backgroundColor: renderedItems.includes(item) ? "lime" : null}}>
                                            {/*{item.id}*/}
                                            {item?.data}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div>
                        <h3>Debug: Backend Items (mocked)</h3>
                        <div>
                            {
                                allItems.map((item) => {
                                    return (
                                        <div key={item?.id}
                                             style={{backgroundColor: fetchedItems.includes(item) ? "cyan" : null}}>
                                            {/*{item.id}*/}
                                            {item?.data}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default App


function RowItem({index, data}: { index: number, data: string }) {
    return (
        <div style={{
            height: 60,
            padding: 10,
            margin: 2,
            backgroundColor: "lightgrey",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
        }}>
            <div>
                <div>
                    Row {index}: {data}
                </div>
                <div>
                    <label>Data </label>
                    <input type="text" value={data} style={{height: 25}}/>
                </div>
            </div>
            <button>Update!</button>
        </div>
    )
}