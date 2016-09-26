
Million Books Test
==================


How to run it
-------------

Just place it in any environment that's able to return static files and open index.html.
The list is empty by default. There's a counter at the top left corner, any count of books may be specified.

Demo
----

See demo [here](http://t1.rag.lt/).


Description
-----------

That's the frontend task that's why I didn't use any server side storage.
It's about maintaining very large list of items.
Without any storage I haven't other possibility than keeping all items in memory.
That's the true list without any generate-random-book-while-scroll-on-the-fly.
So you can scroll down for 50.000 items, then scroll up, scroll down one more time and see the same books at the same positions as earlier.
That's why I keep all books in memory, that's just javascript array.
Generating a 1.000.000 items should take about 2s.
I could add several indexes on book's category, name and author's name to make filters and sorters work faster (using binary search tree), but instead of this I focused on the list visualization and scrolling.
So triggering different sort modes on the full list of items will take some time, it rebuilds the whole array in specified order.
Sorting operation is the last in processing queue that's why triggering sort on the list with selected genre or gender runs much faster.
During the scroll console outputs some information about the number of books that are placed in DOM.
The list should work also on a small amounts of books, it has to stop at the end of the list.
The common scroll scheme it that the system keeps 4 screens over the current screen and 4 screens under it. When there're less than 2 screens in any direction it adds 2 screens more in the scroll direction and removes 2 screens from the other side.
It removes items that are further than 4 screens from the current screen, that's why scroll is trully endless - there's no dom overflow after a hour of pressing PgDown.

During the scroll there may appear 4 cases:
	* add items to the bottom;
	* remove items from the top;
	* add items to the top;
	* remove items from the bottom;

Each cases uses different logic.

The most complex case is adding items to the top while scrolling up. The system has to add several items so that there will be 4 screens over the current screen in total.
But it does not know the real height of the element before it will be placed to the DOM. That's why it adds elements one after another and checks the result height every time.
Every item unshifts the list down by it's height, that's why scrollTop offset should be updated to keep current visible items on their positions on the screen.
But it can't really do it without the lag, because at first it appends item to the DOM (and visible items moved down by it's height), then it measures the height, and only then it can update scroll by the value.
To fix this issue I had to freeze the list to the bottom - calculate and apply offsets, make the list to be with position: absolute, bottom: 0, then add items to the top (the list sticked to the bottom, that's why currently visible items will not go down during adding anything on top of them), then calculate the summary offset and unfreeze it back.
